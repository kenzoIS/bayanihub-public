/**
 * Typed API client for the BayaniHub NestJS backend.
 * All requests go through this module so the base URL can be
 * changed in a single place via NEXT_PUBLIC_API_BASE_URL.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${options?.method ?? 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Volunteer Roles ─────────────────────────────────────────────────────────

export const VolunteerRolesAPI = {
  list: (params?: { campaign_id?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<any[]>(`/volunteer-roles${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/volunteer-roles/${id}`),
};

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const CampaignsAPI = {
  list: (params?: { type?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<any[]>(`/campaigns${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/campaigns/${id}`),
  damayanSources: () => request<any>('/campaigns/damayan-sources'),
  activateDamayan: (payload: {
    source_type: 'relief_operation' | 'evacuation_center';
    source_id: string;
    mission_type?: 'donation' | 'volunteer';
    notes?: string;
    volunteers_needed?: number;
  }) =>
    request<any>('/campaigns/activate-damayan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Missions ────────────────────────────────────────────────────────────────

export const MissionsAPI = {
  activate: (payload: {
    campaign_id: string;
    role_id: string;
    urgency: string;
    notes?: string;
    activated_by?: string;
  }) =>
    request<any>('/missions/activate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  volunteerSummary: (campaign_id?: string) =>
    request<any>(
      `/missions/volunteer-summary${campaign_id ? `?campaign_id=${campaign_id}` : ''}`,
    ),
};

// ─── QR Code Scanning ────────────────────────────────────────────────────────

export const QrScanAPI = {
  verify: (applicationId: string) =>
    request<any>(`/qr-scan/${applicationId}`),
  reconcile: (payload: { donation_id: string; item_name: string; quantity: number; unit: string; donation_type?: string }) =>
    request<any>('/qr-scan/reconcile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
