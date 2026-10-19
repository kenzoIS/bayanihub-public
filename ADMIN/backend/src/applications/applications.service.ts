import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase';
import {
  FilterApplicationsDto,
  ReviewApplicationDto,
  ApplicationStatus,
} from './dto/applications.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll(filters: FilterApplicationsDto) {
    let query = this.supabase
      .from('volunteer_applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (filters.role_id) {
      query = query.eq('role_id', filters.role_id);
    }
    // If a specific status is requested use it; otherwise show the active queue (submitted + pending)
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.in('status', ['submitted', 'pending']);
    }
    if (filters.search) {
      query = query.or(
        `motivation.ilike.%${filters.search}%,skills.ilike.%${filters.search}%`,
      );
    }

    const { data: applications, error } = await query;
    if (error) throw error;
    if (!applications?.length) return [];

    const roleIds = [...new Set(applications.map((a) => a.role_id).filter(Boolean))];
    const volunteerIds = [...new Set(applications.map((a) => a.volunteer_auth_id).filter(Boolean))];

    const [rolesRes, profilesRes] = await Promise.all([
      roleIds.length
        ? this.supabase.from('volunteer_roles').select('id, title, campaign_id').in('id', roleIds)
        : { data: [] },
      volunteerIds.length
        ? this.supabase.from('user_profiles').select('auth_user_id, first_name, last_name, phone, address, barangay, municipality, province, profile_photo_key, role').in('auth_user_id', volunteerIds)
        : { data: [] },
    ]);

    const roleMap = new Map((rolesRes.data ?? []).map((r: any) => [r.id, r]));
    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.auth_user_id, p]));

    return applications.map((a) => ({
      ...a,
      volunteer_roles: roleMap.get(a.role_id) ?? null,
      user_profiles: profileMap.get(a.volunteer_auth_id) ?? null,
    }));
  }

  async findOne(id: string) {
    const { data: application, error } = await this.supabase
      .from('volunteer_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!application) throw new NotFoundException('Application not found');

    const [roleRes, profileRes] = await Promise.all([
      application.role_id
        ? this.supabase.from('volunteer_roles').select('id, title, description, requirements, campaign_id, location, start_date, end_date').eq('id', application.role_id).single()
        : { data: null },
      application.volunteer_auth_id
        ? this.supabase.from('user_profiles').select('auth_user_id, first_name, last_name, phone, address, barangay, municipality, province, profile_photo_key, role').eq('auth_user_id', application.volunteer_auth_id).single()
        : { data: null },
    ]);

    return {
      ...application,
      volunteer_roles: roleRes.data ?? null,
      user_profiles: profileRes.data ?? null,
    };
  }

  /**
   * Approve or Reject an application.
   * - Approve: sets status to 'approved' and marks user's profile as verified (role update).
   * - Reject: sets status to 'rejected'.
   */
  async review(
    applicationId: string,
    dto: ReviewApplicationDto,
    reviewerUserId: string | null,
  ) {
    // Verify application exists
    const { data: application, error: fetchErr } = await this.supabase
      .from('volunteer_applications')
      .select('id, volunteer_auth_id, status')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !application) {
      throw new NotFoundException('Application not found');
    }

    // Update application status
    const { data: updated, error: updateErr } = await this.supabase
      .from('volunteer_applications')
      .update({
        status: dto.status,
        reviewed_by: reviewerUserId,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // If approved, mark the user's profile role as 'volunteer' (verified)
    if (dto.status === ApplicationStatus.APPROVED) {
      const { error: profileErr } = await this.supabase
        .from('user_profiles')
        .update({ role: 'volunteer' })
        .eq('auth_user_id', application.volunteer_auth_id);

      if (profileErr) throw profileErr;
    }

    return updated;
  }

  /**
   * Get available volunteer roles, optionally filtered by campaign.
   */
  async getRoles(campaignId?: string) {
    let query = this.supabase
      .from('volunteer_roles')
      .select('*')
      .eq('status', 'active');

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
