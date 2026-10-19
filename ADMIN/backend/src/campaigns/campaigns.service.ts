import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase';
import { FilterCampaignsDto, UpdateCampaignDto } from './dto/campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * List campaigns (donation inventory) with filters.
   * Provides: Items, Sites, Date, Time information from campaign + volunteer_roles.
   */
  async findAll(filters: FilterCampaignsDto) {
    let query = this.supabase
      .from('bh_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.org_id) {
      query = query.eq('org_id', filters.org_id);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    const { data: campaigns, error } = await query;
    if (error) throw error;
    if (!campaigns?.length) return [];

    const orgIds = [...new Set(campaigns.map((c) => c.org_id).filter(Boolean))];
    const campaignIds = campaigns.map((c) => c.id);

    const [orgsRes, rolesRes] = await Promise.all([
      orgIds.length
        ? this.supabase.from('organizations').select('id, name, type, address, verified').in('id', orgIds)
        : { data: [] },
      campaignIds.length
        ? this.supabase.from('volunteer_roles').select('id, title, slots_total, slots_filled, location, start_date, end_date, status, campaign_id').in('campaign_id', campaignIds)
        : { data: [] },
    ]);

    const orgMap = new Map((orgsRes.data ?? []).map((o: any) => [o.id, o]));
    const rolesGrouped = new Map<string, any[]>();
    for (const r of rolesRes.data ?? []) {
      const arr = rolesGrouped.get(r.campaign_id) ?? [];
      arr.push(r);
      rolesGrouped.set(r.campaign_id, arr);
    }

    return campaigns.map((c) => ({
      ...c,
      organizations: orgMap.get(c.org_id) ?? null,
      volunteer_roles: rolesGrouped.get(c.id) ?? [],
    }));
  }

  async findOne(id: string) {
    const { data: campaign, error: campaignErr } = await this.supabase
      .from('bh_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignErr) throw campaignErr;
    if (!campaign) throw new NotFoundException('Campaign not found');

    const [orgRes, rolesRes, donationsRes] = await Promise.all([
      campaign.org_id
        ? this.supabase.from('organizations').select('id, name, type, contact_email, contact_phone, address, verified').eq('id', campaign.org_id).single()
        : { data: null },
      this.supabase.from('volunteer_roles').select('*').eq('campaign_id', id),
      this.supabase.from('donations').select('*').eq('campaign_id', id).order('donated_at', { ascending: false }),
    ]);

    // For donations, manually fetch donor profiles
    const donations = donationsRes.data ?? [];
    let donationsWithProfiles = donations;
    if (donations.length) {
      const donorIds = [...new Set(donations.map((d: any) => d.donor_auth_id).filter(Boolean))];
      if (donorIds.length) {
        const { data: profiles } = await this.supabase.from('user_profiles').select('auth_user_id, first_name, last_name').in('auth_user_id', donorIds);
        const profileMap = new Map((profiles ?? []).map((p: any) => [p.auth_user_id, p]));
        donationsWithProfiles = donations.map((d: any) => ({
          ...d,
          user_profiles: profileMap.get(d.donor_auth_id) ?? null,
        }));
      }
    }

    return {
      ...campaign,
      organizations: orgRes.data ?? null,
      volunteer_roles: rolesRes.data ?? [],
      donations: donationsWithProfiles,
    };
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const updateData: Record<string, any> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.target_amount !== undefined) updateData.target_amount = dto.target_amount;
    if (dto.status !== undefined) updateData.status = dto.status;

    const { data, error } = await this.supabase
      .from('bh_campaigns')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Campaign not found');

    return this.findOne(id);
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('bh_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { deleted: true };
  }

  /**
   * Get campaign statistics for the dashboard.
   */
  async getStats() {
    const { count: totalCampaigns } = await this.supabase
      .from('bh_campaigns')
      .select('*', { count: 'exact', head: true });

    const { count: activeCampaigns } = await this.supabase
      .from('bh_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { data: sumData } = await this.supabase
      .from('bh_campaigns')
      .select('current_amount');

    const totalRaised = (sumData ?? []).reduce(
      (sum, c) => sum + Number(c.current_amount ?? 0),
      0,
    );

    return {
      total_campaigns: totalCampaigns ?? 0,
      active_campaigns: activeCampaigns ?? 0,
      total_raised: totalRaised,
    };
  }
}
