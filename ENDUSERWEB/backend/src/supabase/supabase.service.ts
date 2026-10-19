import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type MissionTaskStatus = 'in_progress' | 'completed' | undefined;

type MissionContext = {
  applications: any[];
  deployment: any | null;
  role: any | null;
  application: any | null;
  campaign: any | null;
  zone: any | null;
  shift: any | null;
  shifts: any[];
  deployments: any[];
};

const ACTIVE_SHIFT_STATUSES = ['pending', 'flagged'];

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    // BayaniHub DB (primary)
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Connected to BayaniHub DB. ENDUSER mission lists use SITEMAN-activated BayaniHub campaigns.');
    
    // Ensure storage buckets exist
    this.initializeBuckets();
  }

  private async initializeBuckets() {
    const required = ['volunteer-documents', 'identity-documents'];
    try {
      const { data: buckets, error } = await this.client.storage.listBuckets();
      if (error) throw error;

      for (const bucketName of required) {
        if (!buckets.find(b => b.name === bucketName)) {
          this.logger.log(`Storage Bucket "${bucketName}" missing. Creating...`);
          const { error: createError } = await this.client.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            fileSizeLimit: 10 * 1024 * 1024 // 10MB
          });
          if (createError) {
            this.logger.error(`Failed to create bucket "${bucketName}": ${createError.message}`);
          } else {
            this.logger.log(`Storage Bucket "${bucketName}" created successfully.`);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Initial bucket check failed (possibly insufficient permissions): ${err.message}`);
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAnonKey(): string {
    return this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  getUrl(): string {
    return this.config.getOrThrow<string>('SUPABASE_URL');
  }

  // --- BAYANIHUB WORKFLOW INSERTS ---

  async insertVolunteerApplication(data: any, volunteerAuthId: string, file?: Express.Multer.File) {
    const { role, center_id, campaign_id, center_name } = data;
    
    // Determine the ID and a human-readable name
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    const validCampaignId = isUUID(center_id) ? center_id : (isUUID(campaign_id) ? campaign_id : null);
    const displayName = center_name || (validCampaignId ? 'In-Progress Selection' : 'N/A');

    if (!validCampaignId && !center_name) {
      throw new Error("Missing site location or campaign identifier.");
    }

    if (!role) {
      throw new Error("Missing selected role in application payload.");
    }

    // 1. Resolve role_id (scoped to campaign if ID is available)
    let query = this.client
      .from('volunteer_roles')
      .select('id')
      .ilike('title', role);
      
    if (validCampaignId) {
      query = query.eq('campaign_id', validCampaignId);
    }

    let { data: roles } = await query.limit(1);

    let roleId;
    if (!roles || roles.length === 0) {
      const { data: newRole, error: roleErr } = await this.client
        .from('volunteer_roles')
        .insert([{
          title: role,
          campaign_id: validCampaignId, // Will be null if no valid UUID
          status: 'open',
          slots_total: 10
        }]).select('id').single();
      if (roleErr) throw new Error(`Role Creation Error: ${roleErr.message}`);
      roleId = newRole.id;
    } else {
      roleId = roles[0].id;
    }

    // 2. Upload Document
    let resumeKey = null;
    if (file) {
      resumeKey = await this.uploadFile(file, 'resumes');
    }

    // 3. Condense Questionnaire Data
    const motivationStr = `Questionnaire Assessment:
- Site/Campaign: ${displayName} (${validCampaignId || 'No UUID Mapping'})
- Disaster Experience: ${data.disaster_experience === 'true' || data.disaster_experience === true ? 'Yes' : 'No'}
- Rugged Environment Comfort: ${data.rugged_environment === 'true' || data.rugged_environment === true ? 'Yes' : 'No'}
- Medical Conditions/Restrictions: ${data.medical_conditions === 'true' || data.medical_conditions === true ? 'Yes' : 'No'}
- Vaccinations Current: ${data.vaccinations_current === 'true' || data.vaccinations_current === true ? 'Yes' : 'No'}
- Can Lift 25lbs: ${data.can_lift_25lbs === 'true' || data.can_lift_25lbs === true ? 'Yes' : 'No'}
- Transportation: ${data.has_transportation === 'true' || data.has_transportation === true ? 'Yes' : 'No'} (${data.transportation_mode || 'N/A'})
- Background Check Agreed: ${data.background_check_agreed === 'true' || data.background_check_agreed === true ? 'Yes' : 'No'}
- Required Documents Provided: ${data.documents_agreed === 'true' || data.documents_agreed === true ? 'Yes' : 'No'}
- Over 18: ${data.age_verified === 'true' || data.age_verified === true ? 'Yes' : 'No'}
- Code of Conduct / Safety Agreed: Yes`;

    // 4. Insert Application
    const applicationPayload = {
      role_id: roleId,
      volunteer_auth_id: volunteerAuthId,
      motivation: motivationStr,
      skills: [role || 'Volunteer'],
      availability: data.time_slot,
      resume_key: resumeKey,
      status: 'submitted'
    };

    console.log('Inserting Volunteer Application:', applicationPayload);

    const { data: result, error } = await this.client
      .from('volunteer_applications')
      .insert([applicationPayload])
      .select();
      
    if (error) {
      this.logger.error(`Supabase Volunteer Error: ${error.message} (Code: ${error.code})`);
      this.logger.error(`Failed Payload: ${JSON.stringify(applicationPayload)}`);
      throw new Error(`Supabase Error: ${error.message}`);
    }
    return result;
  }

  async getLatestApplication(userId: string) {
    const { data, error } = await this.client
      .from('volunteer_applications')
      .select('*')
      .eq('volunteer_auth_id', userId)
      .order('applied_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error(`Error fetching application for user ${userId}: ${error.message}`);
      throw new Error(`Supabase Error: ${error.message}`);
    }
    
    if (data && data.role_id) {
       const { data: role } = await this.client.from('volunteer_roles').select('*').eq('id', data.role_id).single();
       if (role) {
         data.volunteer_roles = role;
       }
    }

    return data;
  }

  async getAllApplications(userId: string) {
    // Fetch all volunteer applications
    const { data: vApps, error: vError } = await this.client
      .from('volunteer_applications')
      .select('*')
      .eq('volunteer_auth_id', userId)
      .order('applied_at', { ascending: false });

    if (vError && vError.code !== 'PGRST116') {
      this.logger.error(`Error fetching volunteer applications for user ${userId}: ${vError.message}`);
    }

    // Fetch all donations
    const { data: dApps, error: dError } = await this.client
      .from('donations')
      .select('*')
      .eq('donor_auth_id', userId)
      .order('donated_at', { ascending: false });

    if (dError && dError.code !== 'PGRST116') {
      this.logger.error(`Error fetching donations for user ${userId}: ${dError.message}`);
    }

    // Fetch all QR codes for this user
    const { data: qrCodes, error: qrError } = await this.client
      .from('qr_codes')
      .select('*')
      .or(`volunteer_auth_id.eq.${userId},donor_auth_id.eq.${userId}`);

    if (qrError && qrError.code !== 'PGRST116') {
      this.logger.error(`Error fetching QR codes for user ${userId}: ${qrError.message}`);
    }

    const applications = [];

    // Process volunteer applications
    if (vApps) {
      let rolesMap = new Map();
      const roleIds = [...new Set(vApps.map((a: any) => a.role_id).filter(Boolean))];
      if (roleIds.length > 0) {
        const { data: roles } = await this.client.from('volunteer_roles').select('*').in('id', roleIds);
        if (roles) {
          roles.forEach((r: any) => rolesMap.set(r.id, r));
        }
      }

      for (const app of vApps) {
        let qrUrl = null;
        if (qrCodes) {
          const qr = qrCodes.find((q: any) => q.application_id === app.id);
          if (qr) qrUrl = qr.public_url;
        }

        let appType = "Volunteer Application";
        const role = rolesMap.get(app.role_id);
        if (role && role.title) {
           appType = `Volunteer - ${role.title}`;
        } else if (app.skills && app.skills.length > 0) {
           appType = `Volunteer - ${app.skills[0]}`;
        }

        let normStatus = app.status ? app.status.toUpperCase() : 'PENDING';
        if (normStatus === 'SUBMITTED') normStatus = 'PENDING';
        if (normStatus === 'CONFIRMED') normStatus = 'APPROVED';

        applications.push({
          refId: app.id,
          applicantId: app.volunteer_auth_id,
          applicationType: appType,
          submittedAt: app.applied_at || app.created_at || new Date().toISOString(),
          status: normStatus,
          rejectionReason: null,
          updatedAt: app.applied_at || app.created_at || new Date().toISOString(),
          qrToken: qrUrl,
          raw: app
        });
      }
    }

    // Process donations - group by a simple time window or transaction_ref if exists
    if (dApps && dApps.length > 0) {
      const groupedDonations = new Map();

      for (const d of dApps) {
        // use transaction_ref if exists, otherwise fallback to date-hour to group close ones
        let key = d.transaction_ref;
        if (!key) {
           const dDate = new Date(d.donated_at || d.created_at || new Date());
           key = `DON-${dDate.toISOString().substring(0, 13)}`; // group by hour
        }
        
        if (!groupedDonations.has(key)) {
           groupedDonations.set(key, {
              id: d.transaction_ref || d.id, // Group ID
              items: [],
              status: d.status,
              donated_at: d.donated_at || d.created_at || new Date().toISOString(),
              donor_auth_id: d.donor_auth_id,
              donationIds: []
           });
        }
        const group = groupedDonations.get(key);
        group.items.push(`${d.quantity} ${d.unit} of ${d.item_name}`);
        group.donationIds.push(d.id);
        // Status resolution - if any pending, it's pending. if all approved, it's approved. For simplicity we just take the first one or we can prioritize
        if (d.status === 'pending') group.status = 'pending';
      }

      for (const [key, group] of groupedDonations.entries()) {
        let qrUrl = null;
        if (qrCodes) {
          // Find QR code that matches any of the donation IDs in this group
          const qr = qrCodes.find((q: any) => group.donationIds.includes(q.donation_id) || q.donation_id === group.id);
          if (qr) qrUrl = qr.public_url;
        }

        let normStatus = group.status ? group.status.toUpperCase() : 'PENDING';
        if (normStatus === 'SUBMITTED') normStatus = 'PENDING';
        if (normStatus === 'CONFIRMED') normStatus = 'APPROVED';

        applications.push({
          refId: group.id,
          applicantId: group.donor_auth_id,
          applicationType: `Donation - ${group.items.join(', ')}`,
          submittedAt: group.donated_at,
          status: normStatus,
          rejectionReason: null,
          updatedAt: group.donated_at,
          qrToken: qrUrl,
          raw: group
        });
      }
    }

    // Sort all applications by submittedAt desc
    applications.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return applications;
  }

  async getVolunteerCampaigns() {
    const { data: result, error } = await this.client
      .from('bh_campaigns')
      .select('id, title, description, type, status, start_date, end_date, created_at')
      .eq('status', 'active')
      .eq('type', 'volunteer')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`BayaniHub Campaign Error: ${error.message}`);
    return (result ?? []).map((campaign: any) => ({
      ...campaign,
      name: campaign.title,
    }));
  }

  async getActiveCampaigns() {
    const { data: result, error } = await this.client
      .from('bh_campaigns')
      .select('id, title, description, type, status, start_date, end_date, created_at')
      .eq('status', 'active')
      .eq('type', 'donation')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`BayaniHub Campaign Error: ${error.message}`);
    return (result ?? []).map((campaign: any) => ({
      ...campaign,
      name: campaign.title,
    }));
  }

  async insertDonation(donationData: any, donorAuthId: string) {
    const { campaign_id, center_id, center_name, items } = donationData;
    const finalCampaignId = campaign_id || center_id || center_name;
    
    if (!items || !Array.isArray(items)) {
      throw new Error("Invalid donation payload. Missing items array.");
    }

    const rows = items.map((item: any) => ({
      campaign_id: finalCampaignId,
      donor_auth_id: donorAuthId,
      status: 'pending',
      item_name: item.name,
      // Handle both qty (mobile) and quantity (web)
      quantity: parseInt(item.qty || item.quantity, 10) || 1,
      unit: (item.unit || 'pieces').toLowerCase(),
      condition: (item.condition || 'good').toLowerCase().replace(/\s+|-/g, '_'),
    }));

    const { data: result, error } = await this.client
      .from('donations')
      .insert(rows)
      .select();
      
    if (error) {
      this.logger.error(`Supabase Donation Error: ${error.message}`);
      throw new Error(`Supabase Error: ${error.message}`);
    }
    return result;
  }

  async getMyMission(userId: string, applicationId?: string) {
    const context = await this.getMissionContext(userId, applicationId);
    return this.formatMissionResponse(context);
  }

  async getMyMissions(userId: string) {
    const { data: applications, error } = await this.client
      .from('volunteer_applications')
      .select('*')
      .eq('volunteer_auth_id', userId)
      .eq('status', 'approved')
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load volunteer applications: ${error.message}`);
    }

    const approvedApplications = applications ?? [];
    const missionResponses = await Promise.all(
      approvedApplications.map(async (application: any) => {
        const context = await this.getMissionContext(userId, application.id);
        const response = this.formatMissionResponse(context);
        return {
          applicationId: application.id,
          submittedAt: application.applied_at ?? application.created_at ?? null,
          state: response.state,
          mission: response.mission,
          shift: response.shift,
        };
      }),
    );

    return missionResponses.sort((a, b) => {
      const aAssigned = new Date(a.mission?.assignedAt ?? a.submittedAt ?? 0).getTime();
      const bAssigned = new Date(b.mission?.assignedAt ?? b.submittedAt ?? 0).getTime();
      return bAssigned - aAssigned;
    });
  }

  async startMyMission(userId: string, applicationId?: string) {
    const context = await this.getMissionContext(userId, applicationId);
    if (!context.deployment) {
      throw new Error('No mission has been assigned to your volunteer application yet.');
    }
    if (context.shift?.status === 'pending' && context.shift.clock_out) {
      throw new Error('Your clock-out request is waiting for site manager approval.');
    }

    await this.updateDeploymentStatus(context.deployment, 'active');
    await this.ensureShiftForMission(userId, context);

    return this.getMyMission(userId, context.application?.id ?? applicationId);
  }

  async updateMyMissionTaskStatus(userId: string, status: MissionTaskStatus, applicationId?: string) {
    if (status !== 'in_progress' && status !== 'completed') {
      throw new Error('Task status must be either in_progress or completed.');
    }

    const context = await this.getMissionContext(userId, applicationId);
    if (!context.deployment) {
      throw new Error('No mission has been assigned to your volunteer application yet.');
    }
    if (context.shift?.status === 'pending' && context.shift.clock_out) {
      throw new Error('Your clock-out request is already waiting for site manager approval.');
    }
    if (status === 'completed' && !context.shift) {
      throw new Error('Please start the mission before marking the task as completed.');
    }

    await this.updateDeploymentStatus(context.deployment, status === 'completed' ? 'completed' : 'active');
    if (status === 'in_progress') {
      await this.ensureShiftForMission(userId, context);
    }

    return this.getMyMission(userId, context.application?.id ?? applicationId);
  }

  async requestMyMissionClockOut(userId: string, applicationId?: string) {
    const context = await this.getMissionContext(userId, applicationId);
    if (!context.deployment) {
      throw new Error('No mission has been assigned to your volunteer application yet.');
    }
    if (context.deployment.status !== 'completed') {
      throw new Error('Please mark your assigned task as completed before requesting clock-out.');
    }
    if (!context.shift) {
      throw new Error('No active check-in was found. Please have your QR validated on-site first.');
    }
    if (context.shift.status === 'pending' && context.shift.clock_out) {
      return this.getMyMission(userId, context.application?.id ?? applicationId);
    }
    if (context.shift.status === 'approved') {
      throw new Error('This shift has already been approved.');
    }

    const { error } = await this.client
      .from('volunteer_shifts')
      .update({
        clock_out: new Date().toISOString(),
        status: 'pending',
      })
      .eq('id', context.shift.id);

    if (error) {
      throw new Error(`Unable to request clock-out: ${error.message}`);
    }

    return this.getMyMission(userId, context.application?.id ?? applicationId);
  }

  private async getMissionContext(userId: string, applicationId?: string): Promise<MissionContext> {
    const { data: applications, error: appError } = await this.client
      .from('volunteer_applications')
      .select('*')
      .eq('volunteer_auth_id', userId)
      .eq('status', 'approved')
      .order('applied_at', { ascending: false });

    if (appError) {
      throw new Error(`Unable to load volunteer applications: ${appError.message}`);
    }

    const approvedApplications = applicationId
      ? (applications ?? []).filter((application: any) => application.id === applicationId)
      : (applications ?? []);
    const shifts = await this.getVolunteerShifts(userId);

    if (approvedApplications.length === 0) {
      return {
        applications: [],
        deployment: null,
        role: null,
        application: null,
        campaign: null,
        zone: null,
        shift: this.pickRelevantShift(shifts, null, applicationId),
        shifts,
        deployments: [],
      };
    }

    const applicationIds = approvedApplications
      .map((application: any) => application.id)
      .filter(Boolean);

    let deployments: any[] = [];
    if (applicationIds.length > 0) {
      const { data: deploymentRows, error: deploymentError } = await this.client
        .from('volunteer_deployments')
        .select('*')
        .in('application_id', applicationIds)
        .order('date_assigned', { ascending: false });

      if (deploymentError) {
        throw new Error(`Unable to load mission assignments: ${deploymentError.message}`);
      }
      deployments = deploymentRows ?? [];
    }

    const deployment =
      deployments.find((row: any) => ['active', 'assigned'].includes(String(row.status ?? '').toLowerCase()))
      ?? deployments[0]
      ?? null;

    const application = deployment
      ? approvedApplications.find((row: any) => row.id === deployment.application_id) ?? approvedApplications[0]
      : approvedApplications[0];

    const role = application?.role_id ? await this.fetchVolunteerRole(application.role_id) : null;
    const campaignId = deployment?.damayan_operation_id ?? deployment?.campaign_id ?? role?.campaign_id ?? null;
    const campaign = campaignId ? await this.fetchCampaignSnapshot(campaignId) : null;
    const zone = campaignId ? await this.fetchZoneCapacity(campaignId) : null;
    const shift = this.pickRelevantShift(shifts, deployment, application?.id ?? applicationId);

    return {
      applications: approvedApplications,
      deployment,
      role,
      application,
      campaign,
      zone,
      shift,
      shifts,
      deployments,
    };
  }

  private async getVolunteerShifts(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('volunteer_shifts')
      .select('*')
      .eq('volunteer_auth_id', userId)
      .order('clock_in', { ascending: false })
      .limit(25);

    if (error) {
      this.logger.warn(`Unable to load volunteer shifts for ${userId}: ${error.message}`);
      return [];
    }

    return data ?? [];
  }

  private pickRelevantShift(shifts: any[], deployment?: any | null, applicationId?: string): any | null {
    if (!shifts.length) return null;

    const explicitApplicationShifts = applicationId
      ? shifts.filter((shift: any) => shift.application_id === applicationId)
      : [];
    const deploymentShiftMatches = deployment?.id
      ? shifts.filter((shift: any) => shift.deployment_id === deployment.id)
      : [];
    const applicationScopedPool = explicitApplicationShifts.length > 0
      ? explicitApplicationShifts
      : deploymentShiftMatches;

    if (applicationId && applicationScopedPool.length === 0) {
      return null;
    }

    const assignedAt = deployment?.date_assigned ? new Date(deployment.date_assigned).getTime() : null;
    const basePool = applicationScopedPool.length > 0 ? applicationScopedPool : shifts;
    const relevantShifts = assignedAt
      ? basePool.filter((shift: any) => {
          const clockIn = shift.clock_in ? new Date(shift.clock_in).getTime() : 0;
          return Number.isFinite(clockIn) && clockIn >= assignedAt - 60 * 60 * 1000;
        })
      : basePool;

    const pool = relevantShifts.length > 0 ? relevantShifts : basePool;
    return (
      pool.find((shift: any) => ACTIVE_SHIFT_STATUSES.includes(String(shift.status ?? '').toLowerCase()))
      ?? pool.find((shift: any) => String(shift.status ?? '').toLowerCase() === 'approved')
      ?? pool[0]
      ?? null
    );
  }

  private async fetchVolunteerRole(roleId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('volunteer_roles')
      .select('*')
      .eq('id', roleId)
      .maybeSingle();

    if (error) {
      this.logger.warn(`Unable to load volunteer role ${roleId}: ${error.message}`);
      return null;
    }
    return data ?? null;
  }

  private async fetchCampaignSnapshot(campaignId: string): Promise<any | null> {
    const { data: bayaniCampaign, error: bayaniError } = await this.client
      .from('bh_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (!bayaniError && bayaniCampaign) {
      return {
        source: 'bayanihub',
        id: bayaniCampaign.id,
        title: bayaniCampaign.title ?? bayaniCampaign.name ?? 'Mission campaign',
        description: bayaniCampaign.description ?? '',
        status: bayaniCampaign.status ?? '',
        raw: bayaniCampaign,
      };
    }

    return null;
  }

  private async fetchZoneCapacity(campaignId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('bh_campaigns')
      .select('id, title, description, status')
      .eq('id', campaignId)
      .maybeSingle();

    if (error || !data) return null;

    const capacityMatch = String(data.description ?? '').match(/Capacity:\s*(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/i);
    if (!capacityMatch) return null;

    const currentOccupancy = Number(capacityMatch[1] ?? 0);
    const capacity = Number(capacityMatch[2] ?? 0);
    const occupancyPercent = capacity > 0
      ? Math.min(100, Math.round((currentOccupancy / capacity) * 100))
      : null;

    return {
      id: data.id,
      name: data.title ?? 'Assigned zone',
      municipality: '',
      barangay: '',
      status: data.status ?? '',
      capacity,
      currentOccupancy,
      occupancyPercent,
    };
  }

  private async updateDeploymentStatus(deployment: any, status: 'active' | 'completed') {
    if (!deployment?.id) return;

    const { error } = await this.client
      .from('volunteer_deployments')
      .update({ status })
      .eq('id', deployment.id);

    if (error) {
      throw new Error(`Unable to update task status: ${error.message}`);
    }
  }

  private async ensureShiftForMission(userId: string, context: MissionContext) {
    const reusableShift = context.shift
      && context.shift.status !== 'approved'
      && !(context.shift.status === 'pending' && context.shift.clock_out);

    if (reusableShift) {
      const { error } = await this.client
        .from('volunteer_shifts')
        .update({
          status: 'pending',
          clock_out: null,
        })
        .eq('id', context.shift.id);

      if (error) {
        throw new Error(`Unable to update check-in: ${error.message}`);
      }
      return;
    }

    await this.insertShiftWithFallback(userId, context);
  }

  private async insertShiftWithFallback(userId: string, context: MissionContext) {
    const now = new Date().toISOString();
    const campaignId = context.deployment?.damayan_operation_id ?? context.deployment?.campaign_id ?? context.role?.campaign_id ?? null;
    const richPayload = {
      volunteer_auth_id: userId,
      application_id: context.application?.id,
      deployment_id: context.deployment?.id,
      campaign_id: campaignId,
      clock_in: now,
      status: 'pending',
    };
    const minimalPayload = {
      volunteer_auth_id: userId,
      clock_in: now,
      status: 'pending',
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(richPayload).filter(([, value]) => value !== undefined && value !== null),
    );

    const { error } = await this.client
      .from('volunteer_shifts')
      .insert([cleanedPayload]);

    if (!error) return;

    this.logger.warn(`Rich shift insert failed, retrying minimal payload: ${error.message}`);
    const { error: minimalError } = await this.client
      .from('volunteer_shifts')
      .insert([minimalPayload]);

    if (minimalError) {
      throw new Error(`Unable to create shift: ${minimalError.message}`);
    }
  }

  private formatMissionResponse(context: MissionContext) {
    const reliability = this.calculateReliabilitySummary(context.deployments, context.shifts);

    if (context.applications.length === 0) {
      return {
        state: 'NO_APPROVED_APPLICATION',
        mission: null,
        shift: context.shift ? this.formatShift(context.shift) : null,
        reliability,
        postShiftSummary: null,
      };
    }

    if (!context.deployment) {
      return {
        state: 'APPROVED_WAITING_ASSIGNMENT',
        mission: null,
        shift: context.shift ? this.formatShift(context.shift) : null,
        reliability,
        postShiftSummary: null,
      };
    }

    const state = this.resolveMissionState(context.deployment, context.shift);
    const taskStatus = this.resolveTaskStatus(context.deployment, context.shift);
    const formattedShift = context.shift ? this.formatShift(context.shift) : null;

    return {
      state,
      mission: {
        deploymentId: context.deployment.id,
        applicationId: context.application?.id ?? context.deployment.application_id,
        campaignId: context.deployment.damayan_operation_id ?? context.deployment.campaign_id ?? context.role?.campaign_id ?? null,
        campaignTitle: context.campaign?.title ?? 'Assigned mission',
        campaignStatus: context.campaign?.status ?? '',
        roleTitle: context.role?.title ?? context.application?.skills?.[0] ?? 'Volunteer',
        taskDescription: context.deployment.task_description ?? 'Assigned by Site Manager',
        taskStatus,
        deploymentStatus: context.deployment.status ?? 'active',
        assignedAt: context.deployment.date_assigned ?? null,
        site: context.zone?.name ?? context.role?.location ?? context.campaign?.description ?? '',
        zone: context.zone,
      },
      shift: formattedShift,
      reliability,
      postShiftSummary: state === 'COMPLETED'
        ? {
            totalHours: Number(context.shift?.total_hours ?? 0),
            approvedAt: context.shift?.updated_at ?? context.shift?.created_at ?? null,
            completedTaskCount: reliability.metrics.completedTasks,
            score: reliability.score,
          }
        : null,
    };
  }

  private resolveMissionState(deployment: any, shift: any | null): string {
    const shiftStatus = String(shift?.status ?? '').toLowerCase();
    const deploymentStatus = String(deployment?.status ?? '').toLowerCase();
    const hasClockOut = Boolean(shift?.clock_out);

    if (shiftStatus === 'approved') return 'COMPLETED';
    if (shiftStatus === 'flagged') return 'CLOCK_OUT_DENIED';
    if (shiftStatus === 'pending' && hasClockOut) return 'CLOCK_OUT_REQUESTED';
    if (deploymentStatus === 'completed') return 'TASK_COMPLETED';
    if (shift && !hasClockOut) return 'IN_PROGRESS';
    return 'ASSIGNED';
  }

  private resolveTaskStatus(deployment: any, shift: any | null): 'assigned' | 'in_progress' | 'completed' {
    const deploymentStatus = String(deployment?.status ?? '').toLowerCase();
    if (deploymentStatus === 'completed') return 'completed';
    if (shift && !shift.clock_out) return 'in_progress';
    return 'assigned';
  }

  private formatShift(shift: any) {
    return {
      id: shift.id,
      status: shift.status ?? '',
      clockIn: shift.clock_in ?? null,
      clockOut: shift.clock_out ?? null,
      totalHours: Number(shift.total_hours ?? 0),
      reviewNote: shift.review_note ?? shift.notes ?? null,
    };
  }

  private calculateReliabilitySummary(deployments: any[], shifts: any[]) {
    const completedTasks = deployments.filter((deployment: any) => deployment.status === 'completed').length;
    const approvedShifts = shifts.filter((shift: any) => shift.status === 'approved').length;
    const rejectedClockOuts = shifts.filter((shift: any) => shift.status === 'flagged').length;
    const approvedHours = shifts
      .filter((shift: any) => shift.status === 'approved')
      .reduce((sum: number, shift: any) => sum + Number(shift.total_hours ?? 0), 0);
    const noShows = deployments.filter((deployment: any) => {
      const status = String(deployment.status ?? '').toLowerCase();
      if (!['active', 'assigned'].includes(status) || !deployment.date_assigned) return false;
      const assignedAt = new Date(deployment.date_assigned).getTime();
      const olderThanOneDay = Date.now() - assignedAt > 24 * 60 * 60 * 1000;
      const hasShiftAfterAssignment = shifts.some((shift: any) => {
        const clockIn = shift.clock_in ? new Date(shift.clock_in).getTime() : 0;
        return Number.isFinite(clockIn) && clockIn >= assignedAt;
      });
      return olderThanOneDay && !hasShiftAfterAssignment;
    }).length;

    const efficiencyRatio = approvedHours > 0 ? completedTasks / approvedHours : completedTasks;
    const efficiencyBonus = Math.min(10, Math.round(efficiencyRatio * 4));
    const score = Math.max(
      0,
      Math.min(100, 50 + completedTasks * 8 + approvedShifts * 6 + efficiencyBonus - rejectedClockOuts * 10 - noShows * 12),
    );

    return {
      score,
      label: score >= 85 ? 'Excellent' : score >= 70 ? 'Reliable' : score >= 50 ? 'Developing' : 'Needs review',
      metrics: {
        completedTasks,
        approvedShifts,
        approvedHours: Number(approvedHours.toFixed(2)),
        rejectedClockOuts,
        noShows,
        efficiencyBonus,
      },
    };
  }

  private async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const BUCKET = 'volunteer-documents';
    const filePath = `${folder}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await this.client.storage
      .from(BUCKET)
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      throw new Error(`File upload error: ${uploadError.message}`);
    }

    const { data: urlData } = this.client.storage.from(BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  }
}
