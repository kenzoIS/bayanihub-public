import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type DamayanSourceType = 'relief_operation' | 'evacuation_center';

@Injectable()
export class CampaignsService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  private get damayanDb() {
    return this.supabase.getDamayanClient();
  }

  async findAll(type?: string, status?: string) {
    let query = this.db
      .from('bh_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data: campaigns, error } = await query;
    if (error) throw new BadRequestException(error.message);
    const items = campaigns ?? [];
    if (items.length === 0) return [];

    const orgIds = [...new Set(items.map((c) => c.org_id).filter(Boolean))];
    const campaignIds = items.map((c) => c.id);

    const [orgsRes, rolesRes] = await Promise.all([
      orgIds.length
        ? this.db.from('organizations').select('id, name, type, contact_email').in('id', orgIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      this.db.from('volunteer_roles').select('id, campaign_id, title, slots_total, slots_filled, status').in('campaign_id', campaignIds),
    ]);
    if (orgsRes.error) throw new BadRequestException(orgsRes.error.message);
    if (rolesRes.error) throw new BadRequestException(rolesRes.error.message);

    const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o]));
    const rolesMap: Record<string, any[]> = {};
    for (const r of rolesRes.data ?? []) {
      if (!rolesMap[r.campaign_id]) rolesMap[r.campaign_id] = [];
      rolesMap[r.campaign_id].push(r);
    }

    return items.map((c) => ({
      ...c,
      organizations: orgMap.get(c.org_id) ?? null,
      volunteer_roles: rolesMap[c.id] ?? [],
    }));
  }

  async findOne(id: string) {
    const { data: campaign, error } = await this.db
      .from('bh_campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !campaign) throw new NotFoundException(`Campaign ${id} not found`);

    const [orgRes, rolesRes, donationsRes] = await Promise.all([
      (campaign as any).org_id
        ? this.db.from('organizations').select('id, name, type, contact_email, contact_phone, address, verified').eq('id', (campaign as any).org_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      this.db.from('volunteer_roles').select('id, title, description, requirements, slots_total, slots_filled, location, start_date, end_date, status').eq('campaign_id', id),
      this.db.from('donations').select('id, amount, currency, status, donated_at').eq('campaign_id', id),
    ]);

    let coverSignedUrl: string | null = null;
    if ((campaign as any).cover_image_key) {
      coverSignedUrl = await this.supabase.getSignedUrl('campaign-covers', (campaign as any).cover_image_key);
    }

    return {
      ...campaign,
      organizations: orgRes.data ?? null,
      volunteer_roles: rolesRes.data ?? [],
      donations: donationsRes.data ?? [],
      cover_signed_url: coverSignedUrl,
    };
  }

  async getDamayanSources() {
    const [reliefRes, centersRes] = await Promise.all([
      this.damayanDb
        .from('relief_operations')
        .select('id, name, description, start_date, end_date, status, created_at')
        .order('created_at', { ascending: false }),
      this.damayanDb
        .from('evacuation_centers')
        .select('id, name, address, barangay, municipality, capacity, current_occupancy, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (reliefRes.error) throw new BadRequestException(`DAMAYAN relief operations error: ${reliefRes.error.message}`);
    if (centersRes.error) throw new BadRequestException(`DAMAYAN evacuation centers error: ${centersRes.error.message}`);

    const { data: campaigns, error: campaignsError } = await this.db
      .from('bh_campaigns')
      .select('id, title, description, type, status, created_at');
    if (campaignsError) throw new BadRequestException(campaignsError.message);

    const normalizedRelief = (reliefRes.data ?? []).map((row: any) => this.normalizeDamayanSource(row, 'relief_operation', campaigns ?? []));
    const normalizedCenters = (centersRes.data ?? []).map((row: any) => this.normalizeDamayanSource(row, 'evacuation_center', campaigns ?? []));

    return {
      relief_operations: normalizedRelief,
      evacuation_centers: normalizedCenters,
    };
  }

  async activateDamayanMission(dto: {
    source_type: DamayanSourceType;
    source_id: string;
    mission_type?: 'donation' | 'volunteer';
    notes?: string;
    volunteers_needed?: number;
  }) {
    if (!dto.source_type || !dto.source_id) {
      throw new BadRequestException('DAMAYAN source type and source id are required.');
    }

    const source = await this.fetchDamayanSource(dto.source_type, dto.source_id);
    const missionType = dto.mission_type ?? (dto.source_type === 'evacuation_center' ? 'volunteer' : 'donation');
    const title = source.name ?? 'DAMAYAN Mission';
    const description = this.buildCampaignDescription(source, dto.source_type, dto.notes);
    const createdBy = await this.resolveCampaignCreatorId();

    const existing = await this.findExistingActivatedCampaign(title, dto.source_id, dto.source_type, missionType);
    if (existing) {
      const wasActive = existing.status === 'active';
      const activeCampaign = await this.ensureCampaignActive(existing, source, dto.source_type, missionType);
      await this.ensureVolunteerRoles(activeCampaign.id, source, missionType, dto.volunteers_needed);
      return {
        success: true,
        campaign: activeCampaign,
        created: false,
        message: wasActive
          ? `${title} is active in BayaniHub.`
          : `${title} was reactivated in BayaniHub.`,
      };
    }

    const campaignPayload = this.cleanPayload({
      title,
      description,
      type: missionType,
      status: 'active',
      target_amount: missionType === 'donation' ? 0 : null,
      current_amount: 0,
      start_date: source.start_date ?? source.created_at ?? null,
      end_date: source.end_date ?? null,
      created_by: createdBy,
    });

    const { data: campaign, error } = await this.db
      .from('bh_campaigns')
      .insert(campaignPayload)
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.ensureVolunteerRoles(campaign.id, source, missionType, dto.volunteers_needed);

    return {
      success: true,
      campaign,
      created: true,
      message: `${title} was activated for ${missionType === 'volunteer' ? 'volunteer applications' : 'donation pledges'}.`,
    };
  }

  private normalizeDamayanSource(row: any, sourceType: DamayanSourceType, campaigns: any[]) {
    const missionType = sourceType === 'evacuation_center' ? 'volunteer' : 'donation';
    const marker = this.sourceMarker(row.id, sourceType);
    const activated = campaigns.find((campaign) =>
      campaign.type === missionType
      && typeof campaign.description === 'string'
      && campaign.description.includes(marker),
    );

    return {
      ...row,
      source_type: sourceType,
      mission_type: missionType,
      activated_campaign_id: activated?.id ?? null,
      activated_status: activated?.status ?? null,
    };
  }

  private async fetchDamayanSource(sourceType: DamayanSourceType, sourceId: string): Promise<any> {
    const table = sourceType === 'evacuation_center' ? 'evacuation_centers' : 'relief_operations';
    const columns = sourceType === 'evacuation_center'
      ? 'id, name, address, barangay, municipality, capacity, current_occupancy, status, created_at'
      : 'id, name, description, start_date, end_date, status, created_at';

    const { data, error } = await this.damayanDb
      .from(table)
      .select(columns)
      .eq('id', sourceId)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException(`DAMAYAN ${sourceType.replace('_', ' ')} not found`);
    return data as any;
  }

  private async findExistingActivatedCampaign(title: string, sourceId: string, sourceType: DamayanSourceType, missionType: string) {
    const marker = this.sourceMarker(sourceId, sourceType);
    const { data, error } = await this.db
      .from('bh_campaigns')
      .select('*')
      .eq('type', missionType)
      .ilike('title', title)
      .limit(10);

    if (error) throw new BadRequestException(error.message);
    return (data ?? []).find((campaign) =>
      typeof campaign.description === 'string' && campaign.description.includes(marker),
    ) ?? null;
  }

  private async ensureVolunteerRoles(campaignId: string, source: any, missionType: string, volunteersNeeded = 12) {
    if (missionType !== 'volunteer') return;

    const { data: existingRoles, error: existingError } = await this.db
      .from('volunteer_roles')
      .select('id, title')
      .eq('campaign_id', campaignId);
    if (existingError) throw new BadRequestException(existingError.message);

    const existingTitles = new Set((existingRoles ?? []).map((role) => String(role.title ?? '').toLowerCase()));
    const location = [source.address, source.barangay, source.municipality].filter(Boolean).join(', ');
    const slots = Math.max(1, Math.round(Number(volunteersNeeded || 12) / 3));
    const roles = ['Medic', 'Logistics', 'Field']
      .filter((title) => !existingTitles.has(title.toLowerCase()))
      .map((title) => this.cleanPayload({
        campaign_id: campaignId,
        title,
        description: `${title} support for ${source.name}`,
        requirements: title === 'Medic' ? 'Medical or first aid experience preferred.' : 'On-site disaster response readiness required.',
        slots_total: slots,
        slots_filled: 0,
        location,
        start_date: source.created_at ?? null,
        end_date: null,
        status: 'open',
      }));

    if (roles.length === 0) return;
    const { error } = await this.db.from('volunteer_roles').insert(roles);
    if (error) throw new BadRequestException(error.message);
  }

  private async ensureCampaignActive(existingCampaign: any, source: any, sourceType: DamayanSourceType, missionType: string) {
    if (existingCampaign.status === 'active') {
      return existingCampaign;
    }

    const refreshedPayload = this.cleanPayload({
      description: this.buildCampaignDescription(source, sourceType),
      status: 'active',
      type: missionType,
      start_date: source.start_date ?? source.created_at ?? existingCampaign.start_date ?? null,
      end_date: source.end_date ?? existingCampaign.end_date ?? null,
    });

    const { data, error } = await this.db
      .from('bh_campaigns')
      .update(refreshedPayload)
      .eq('id', existingCampaign.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message ?? 'Unable to reactivate existing BayaniHub mission.');
    }

    return data;
  }

  private async resolveCampaignCreatorId() {
    const { data, error } = await this.db
      .from('user_profiles')
      .select('auth_user_id, role, created_at, updated_at')
      .not('auth_user_id', 'is', null)
      .limit(200);

    if (error) throw new BadRequestException(`Unable to resolve campaign creator: ${error.message}`);

    const profiles = (data ?? []).filter((profile) => profile.auth_user_id);
    const rolePriority = (role: string | null | undefined) => {
      const normalized = String(role ?? '').trim().toLowerCase();
      if (normalized === 'admin') return 0;
      if (
        normalized === 'site_manager'
        || normalized === 'site manager'
        || normalized === 'siteman'
        || normalized === 'site-manager'
      ) return 1;
      if (normalized === 'staff' || normalized === 'operator') return 2;
      return 10;
    };

    const sortedProfiles = [...profiles].sort((a, b) => {
      const roleDelta = rolePriority(a.role) - rolePriority(b.role);
      if (roleDelta !== 0) return roleDelta;
      const aTime = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const bTime = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      return bTime - aTime;
    });

    const creatorId = sortedProfiles[0]?.auth_user_id;
    if (creatorId) {
      return creatorId;
    }

    const { data: usersData, error: usersError } = await this.db.auth.admin.listUsers();
    if (usersError) {
      throw new BadRequestException(`Unable to resolve fallback campaign creator: ${usersError.message}`);
    }

    const fallbackUserId = usersData?.users?.[0]?.id;
    if (!fallbackUserId) {
      throw new BadRequestException('No BayaniHub auth user is available to mark as campaign creator.');
    }

    return fallbackUserId;
  }

  private buildCampaignDescription(source: any, sourceType: DamayanSourceType, notes?: string) {
    const lines = [
      source.description,
      source.address ? `Address: ${source.address}` : null,
      source.barangay || source.municipality ? `Location: ${[source.barangay, source.municipality].filter(Boolean).join(', ')}` : null,
      source.capacity !== undefined ? `Capacity: ${source.current_occupancy ?? 0}/${source.capacity ?? 0}` : null,
      `DAMAYAN Status: ${source.status ?? 'unknown'}`,
      `DAMAYAN Created: ${source.created_at ?? 'unknown'}`,
      notes ? `SITEMAN Notes: ${notes}` : null,
      this.sourceMarker(source.id, sourceType),
    ];

    return lines.filter(Boolean).join('\n');
  }

  private sourceMarker(sourceId: string, sourceType: DamayanSourceType) {
    return `DAMAYAN Source: ${sourceType}:${sourceId}`;
  }

  private cleanPayload(payload: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null),
    );
  }
}
