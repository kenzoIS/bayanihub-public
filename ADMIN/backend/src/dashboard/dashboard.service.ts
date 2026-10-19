import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getStats() {
    const [donorsRes, volunteersRes, campaignsRes, lastDonorUpdateRes, lastVolunteerUpdateRes, lastInventoryUpdateRes] = await Promise.all([
      this.supabase
        .from('donations')
        .select('*', { count: 'exact', head: true }),
      this.supabase
        .from('volunteer_applications')
        .select('*', { count: 'exact', head: true }),
      this.supabase
        .from('bh_campaigns')
        .select('*', { count: 'exact', head: true }),
      this.supabase
        .from('donations')
        .select('donated_at')
        .order('donated_at', { ascending: false })
        .limit(1),
      this.supabase
        .from('volunteer_applications')
        .select('applied_at')
        .order('applied_at', { ascending: false })
        .limit(1),
      this.supabase
        .from('bh_campaigns')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    return {
      activeDonors: donorsRes.count ?? 0,
      volunteers: volunteersRes.count ?? 0,
      inventoryItems: campaignsRes.count ?? 0,
      lastUpdated: {
        donors: lastDonorUpdateRes.data && lastDonorUpdateRes.data.length > 0 ? lastDonorUpdateRes.data[0].donated_at : null,
        volunteers: lastVolunteerUpdateRes.data && lastVolunteerUpdateRes.data.length > 0 ? lastVolunteerUpdateRes.data[0].applied_at : null,
        inventory: lastInventoryUpdateRes.data && lastInventoryUpdateRes.data.length > 0 ? lastInventoryUpdateRes.data[0].created_at : null,
      }
    };
  }

  async getRecentActivity() {
    const [donationsRes, applicationsRes, campaignsRes] = await Promise.all([
      this.supabase
        .from('donations')
        .select('id, amount, currency, donated_at, donor_auth_id')
        .order('donated_at', { ascending: false })
        .limit(5),
      this.supabase
        .from('volunteer_applications')
        .select('id, status, applied_at, volunteer_auth_id, role_id')
        .order('applied_at', { ascending: false })
        .limit(5),
      this.supabase
        .from('bh_campaigns')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const donations = donationsRes.data ?? [];
    const applications = applicationsRes.data ?? [];

    // Fetch related profiles and roles in parallel
    const donorIds = [...new Set(donations.map((d: any) => d.donor_auth_id).filter(Boolean))];
    const volunteerIds = [...new Set(applications.map((a: any) => a.volunteer_auth_id).filter(Boolean))];
    const roleIds = [...new Set(applications.map((a: any) => a.role_id).filter(Boolean))];

    const [donorProfilesRes, volunteerProfilesRes, rolesRes] = await Promise.all([
      donorIds.length
        ? this.supabase.from('user_profiles').select('auth_user_id, first_name, last_name').in('auth_user_id', donorIds)
        : { data: [] },
      volunteerIds.length
        ? this.supabase.from('user_profiles').select('auth_user_id, first_name, last_name').in('auth_user_id', volunteerIds)
        : { data: [] },
      roleIds.length
        ? this.supabase.from('volunteer_roles').select('id, title').in('id', roleIds)
        : { data: [] },
    ]);

    const donorProfileMap = new Map((donorProfilesRes.data ?? []).map((p: any) => [p.auth_user_id, p]));
    const volunteerProfileMap = new Map((volunteerProfilesRes.data ?? []).map((p: any) => [p.auth_user_id, p]));
    const roleMap = new Map((rolesRes.data ?? []).map((r: any) => [r.id, r]));

    const activities = [
      ...donations.map((d: any) => {
        const profile = donorProfileMap.get(d.donor_auth_id);
        return {
          type: 'donation' as const,
          title: 'New donation received',
          subtitle: `${profile?.first_name ?? 'Anonymous'} ${profile?.last_name ?? ''} donated ${d.currency ?? 'PHP'} ${d.amount}`.trim(),
          time: d.donated_at,
        };
      }),
      ...applications.map((a: any) => {
        const profile = volunteerProfileMap.get(a.volunteer_auth_id);
        const role = roleMap.get(a.role_id);
        return {
          type: 'application' as const,
          title: 'Volunteer application submitted',
          subtitle: `${profile?.first_name ?? 'Unknown'} ${profile?.last_name ?? ''} applied for ${role?.title ?? 'volunteer'} role`.trim(),
          time: a.applied_at,
        };
      }),
      ...(campaignsRes.data ?? []).map((c: any) => ({
        type: 'campaign' as const,
        title: 'Campaign created',
        subtitle: `"${c.title}" campaign is now ${c.status}`,
        time: c.created_at,
      })),
    ];

    activities.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    return activities.slice(0, 10);
  }

  async getDashboard() {
    const [stats, recentActivity] = await Promise.all([
      this.getStats(),
      this.getRecentActivity(),
    ]);

    return { stats, recentActivity };
  }
}
