import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase';
import { FilterVolunteerRolesDto } from './dto/volunteers.dto';

@Injectable()
export class VolunteersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findRoles(filters: FilterVolunteerRolesDto) {
    let query = this.supabase
      .from('volunteer_roles')
      .select('*')
      .order('start_date', { ascending: false });

    if (filters.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    const { data: roles, error } = await query;
    if (error) throw error;
    if (!roles?.length) return [];

    const campaignIds = [...new Set(roles.map((r) => r.campaign_id).filter(Boolean))];
    const campaignsRes = campaignIds.length
      ? await this.supabase.from('bh_campaigns').select('id, title, type, status').in('id', campaignIds)
      : { data: [] };

    const campaignMap = new Map((campaignsRes.data ?? []).map((c: any) => [c.id, c]));

    return roles.map((r) => ({
      ...r,
      bh_campaigns: campaignMap.get(r.campaign_id) ?? null,
    }));
  }

  async findRole(id: string) {
    const { data: role, error } = await this.supabase
      .from('volunteer_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!role) throw new NotFoundException('Volunteer role not found');

    let campaign = null;
    if (role.campaign_id) {
      const { data } = await this.supabase
        .from('bh_campaigns')
        .select('id, title, type, start_date, end_date, status')
        .eq('id', role.campaign_id)
        .single();
      campaign = data;
    }

    return { ...role, bh_campaigns: campaign };
  }

  /**
   * Verify if a user is a volunteer by looking up their profile.
   */
  async verifyVolunteer(authUserId: string) {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !profile) {
      return { is_volunteer: false, profile: null };
    }

    return {
      is_volunteer: profile.role === 'volunteer',
      profile,
    };
  }

  /**
   * Search user profiles to check volunteer status.
   */
  async searchVolunteers(search: string) {
    if (!search?.trim()) return [];

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
      );

    if (error) throw error;
    return data;
  }

  /**
   * List volunteer deployments for a given application.
   */
  async getDeployments(applicationId: string) {
    const { data, error } = await this.supabase
      .from('volunteer_deployments')
      .select('*')
      .eq('application_id', applicationId)
      .order('date_assigned', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get volunteer statistics for the dashboard.
   */
  async getStats() {
    const { count: totalApplications } = await this.supabase
      .from('volunteer_applications')
      .select('*', { count: 'exact', head: true });

    const { count: pendingApplications } = await this.supabase
      .from('volunteer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedApplications } = await this.supabase
      .from('volunteer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedApplications } = await this.supabase
      .from('volunteer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    return {
      total: totalApplications ?? 0,
      pending: pendingApplications ?? 0,
      approved: approvedApplications ?? 0,
      rejected: rejectedApplications ?? 0,
    };
  }
}
