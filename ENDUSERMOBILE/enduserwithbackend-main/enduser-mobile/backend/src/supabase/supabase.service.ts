import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private damayanClient!: SupabaseClient;
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

    // Damayan DB (external disaster management)
    const damayanUrl = this.config.getOrThrow<string>('DAMAYAN_SUPABASE_URL');
    const damayanKey = this.config.getOrThrow<string>('DAMAYAN_SERVICE_ROLE_KEY');

    this.damayanClient = createClient(damayanUrl, damayanKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Connected to BayaniHub DB and Damayan DB');
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getDamayanClient(): SupabaseClient {
    return this.damayanClient;
  }

  getAnonKey(): string {
    return this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  getUrl(): string {
    return this.config.getOrThrow<string>('SUPABASE_URL');
  }

  // --- BAYANIHUB WORKFLOW INSERTS ---

  async insertVolunteerApplication(data: any, volunteerAuthId: string, file?: Express.Multer.File) {
    if (!data.center_id || !data.role) {
      throw new Error("Missing center_id or role in application payload.");
    }

    // 1. Resolve role_id — find or create a role for this evacuation center
    let { data: roles } = await this.client
      .from('volunteer_roles')
      .select('id')
      .ilike('title', data.role)
      .limit(1);

    let roleId;
    if (!roles || roles.length === 0) {
      // Auto-provision a role (not campaign-bound since we now use evacuation centers)
      const { data: newRole, error: roleErr } = await this.client
        .from('volunteer_roles')
        .insert([{
          title: data.role,
          status: 'open',
          slots_total: 10
        }]).select('id').single();
      if (roleErr) throw new Error(`Role Creation Error: ${roleErr.message}`);
      roleId = newRole.id;
    } else {
      roleId = roles[0].id;
    }

    // 2. Upload Document (if provided)
    let resumeKey = null;
    if (file) {
      const BUCKET = 'volunteer-documents.';
      const filePath = `${volunteerAuthId}/${Date.now()}-${file.originalname}`;
      
      const { error: uploadError } = await this.client.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, { contentType: file.mimetype });
        
      if (uploadError) throw new Error(`Document upload error: ${uploadError.message}`);
      
      const { data: urlData } = this.client.storage.from(BUCKET).getPublicUrl(filePath);
      resumeKey = urlData.publicUrl;
    }

    // 3. Condense Questionnaire Data into Motivation field
    const motivationStr = `Questionnaire Assessment:
- Evacuation Center: ${data.center_name || 'N/A'}
- Disaster Experience: ${data.disaster_experience === 'true' ? 'Yes' : 'No'}
- Rugged Environment Comfort: ${data.rugged_environment === 'true' ? 'Yes' : 'No'}
- Medical Conditions/Restrictions: ${data.medical_conditions === 'true' ? 'Yes' : 'No'}
- Vaccinations Current: ${data.vaccinations_current === 'true' ? 'Yes' : 'No'}
- Can Lift 25lbs: ${data.can_lift_25lbs === 'true' ? 'Yes' : 'No'}
- Transportation: ${data.has_transportation === 'true' ? 'Yes' : 'No'} (${data.transportation_mode || 'N/A'})
- Background Check Agreed: ${data.background_check_agreed === 'true' ? 'Yes' : 'No'}
- Required Documents Provided: ${data.documents_agreed === 'true' ? 'Yes' : 'No'}
- Over 18: ${data.age_verified === 'true' ? 'Yes' : 'No'}
- Code of Conduct / Safety Agreed: Yes`;

    // 4. Insert Application
    const { data: result, error } = await this.client
      .from('volunteer_applications')
      .insert([{
        role_id: roleId,
        volunteer_auth_id: volunteerAuthId,
        motivation: motivationStr,
        skills: [data.role],
        availability: data.time_slot,
        resume_key: resumeKey,
        status: 'submitted'
      }])
      .select();
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }
  async getVolunteerCampaigns() {
    this.logger.log('[DEBUG] Fetching evacuation centers from Damayan DB...');
    // Fetch evacuation centers from Damayan DB (all statuses for now)
    const { data: result, error } = await this.damayanClient
      .from('evacuation_centers')
      .select('id, name, municipality, barangay, status, capacity, current_occupancy');
      
    if (error) {
      this.logger.error(`[DEBUG] Damayan DB error: ${error.message}`);
      throw new Error(`Damayan DB Error: ${error.message}`);
    }
    this.logger.log(`[DEBUG] Found ${result?.length ?? 0} evacuation center(s). Statuses: ${result?.map(r => r.status).join(', ')}`);
    return result;
  }

  async getActiveCampaigns() {
    this.logger.log('[DEBUG] Fetching relief operations from Damayan DB...');
    // Fetch relief operations from Damayan DB (all statuses for now)
    const { data: result, error } = await this.damayanClient
      .from('relief_operations')
      .select('id, name, description, status');
      
    if (error) {
      this.logger.error(`[DEBUG] Damayan DB error: ${error.message}`);
      throw new Error(`Damayan DB Error: ${error.message}`);
    }
    this.logger.log(`[DEBUG] Found ${result?.length ?? 0} relief operation(s). Statuses: ${result?.map(r => r.status).join(', ')}`);
    return result;
  }

  async insertDonation(donationData: any, donorAuthId: string) {
    const { campaign_id, items } = donationData;
    
    if (!campaign_id || !items || !Array.isArray(items)) {
      throw new Error("Invalid donation payload. Mission campaign_id or items array.");
    }

    const rows = items.map((item: any) => ({
      campaign_id,
      donor_auth_id: donorAuthId,
      status: 'pending',
      item_name: item.name,
      quantity: parseInt(item.qty, 10) || 1,
      unit: (item.unit || 'pieces').toLowerCase(),
      condition: (item.condition || 'good').toLowerCase().replace(/\s+|-/g, '_'),
    }));

    const { data: result, error } = await this.client
      .from('donations')
      .insert(rows)
      .select();
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }

  async getUserApplications(volunteerAuthId: string) {
    this.logger.log(`[DEBUG] Fetching applications for user ID: ${volunteerAuthId}`);

    // Fetch volunteer applications for the authenticated user
    // Note: the timestamp column is 'applied_at', not 'created_at'
    const { data: result, error } = await this.client
      .from('volunteer_applications')
      .select('id, role_id, status, skills, availability, applied_at, motivation')
      .eq('volunteer_auth_id', volunteerAuthId)
      .order('applied_at', { ascending: false });
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    
    this.logger.log(`[DEBUG] Found ${result?.length ?? 0} application(s) for user ${volunteerAuthId}`);

    // Fetch QR codes using the application IDs
    const appIds = result?.map(a => a.id) || [];
    let qrCodes: any[] = [];
    if (appIds.length > 0) {
      const { data } = await this.client
        .from('qr_codes')
        .select('application_id, public_url')
        .in('application_id', appIds);
      if (data) qrCodes = data;
    }

    const qrMap = new Map();
    if (qrCodes) {
      qrCodes.forEach(q => qrMap.set(q.application_id, q.public_url));
    }

    // Map the results to include more readable status information
    return result.map((app) => {
      // try to extract center_name from motivation
      const match = app.motivation?.match(/- Evacuation Center:\s*(.*)/);
      const eventName = match ? match[1].trim() : 'BayaniHub Event';

      return {
        id: app.id,
        role: Array.isArray(app.skills) ? app.skills.join(', ') : (app.skills || 'Volunteer'),
        status: app.status === 'submitted' ? 'under_review' : app.status,
        event_name: eventName,
        event_date: new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        application_id: app.id,
        created_at: app.applied_at,
        qr_code: qrMap.get(app.id) || null,
        motivation: app.motivation,
        availability: app.availability,
      };
    });
  }

  async getUserDonations(donorAuthId: string) {
    this.logger.log(`[DEBUG] Fetching donations for user ID: ${donorAuthId}`);

    // Fetch donations for the authenticated user
    // Note: the timestamp column is 'donated_at', not 'created_at'
    const { data: result, error } = await this.client
      .from('donations')
      .select('id, campaign_id, status, item_name, quantity, unit, donated_at')
      .eq('donor_auth_id', donorAuthId)
      .order('donated_at', { ascending: false });
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    
    // Fetch relief operations names from damayan_db
    const operationIds = [...new Set(result?.map(d => d.campaign_id).filter(Boolean))];
    const opMap = new Map();
    if (operationIds.length > 0) {
      const { data: ops } = await this.damayanClient
        .from('relief_operations')
        .select('id, name')
        .in('id', operationIds);
      if (ops) {
        ops.forEach(op => opMap.set(op.id, op.name));
      }
    }

    // Fetch QR codes using the donation IDs
    const donationIds = result?.map(d => d.id) || [];
    let qrCodes: any[] = [];
    if (donationIds.length > 0) {
      const { data } = await this.client
        .from('qr_codes')
        .select('donation_id, public_url')
        .in('donation_id', donationIds);
      if (data) qrCodes = data;
    }

    const qrMap = new Map();
    if (qrCodes) {
      qrCodes.forEach(q => qrMap.set(q.donation_id, q.public_url));
    }

    // Map the results
    return result.map((donation) => ({
      id: donation.id,
      type: 'donation',
      role: donation.item_name || 'Donation',
      status: donation.status,
      event_name: opMap.get(donation.campaign_id) || 'Goods Pledge',
      event_date: new Date(donation.donated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      created_at: donation.donated_at,
      qr_code: qrMap.get(donation.id) || null,
      quantity: donation.quantity,
      unit: donation.unit,
    }));
  }

  // ─── DEPLOYMENT PORTAL METHODS ───────────────────────────────────────────

  /**
   * Fetch the volunteer's deployment record and their assigned tasks.
   * Chain: volunteer_applications → volunteer_deployments → volunteer_task_assignments
   */
  async getDeploymentInfo(applicationId: string, volunteerAuthId: string) {
    this.logger.log(`[Deployment] Fetching deployment for application ${applicationId}`);

    // 1. Find the deployment linked to this application
    const { data: deployment, error: depErr } = await this.client
      .from('volunteer_deployments')
      .select('id, application_id, damayan_operation_id, task_description, status, date_assigned')
      .eq('application_id', applicationId)
      .neq('status', 'withdrawn')
      .order('date_assigned', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (depErr) throw new Error(`Deployment fetch error: ${depErr.message}`);

    // 2. Fetch assigned tasks for this deployment (if exists)
    let tasks: any[] = [];
    if (deployment) {
      const { data: taskData, error: taskErr } = await this.client
        .from('volunteer_task_assignments')
        .select('id, task_title, status, notes, assigned_at, completed_at')
        .eq('deployment_id', deployment.id)
        .order('assigned_at', { ascending: true });

      if (taskErr) throw new Error(`Task fetch error: ${taskErr.message}`);
      tasks = taskData || [];
    }

    // 3. Check for an active/pending shift
    const { data: activeShift } = await this.client
      .from('volunteer_shifts')
      .select('id, clock_in, clock_out, status, notes, total_hours')
      .eq('volunteer_auth_id', volunteerAuthId)
      .eq('application_id', applicationId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      deployment: deployment || null,
      tasks,
      activeShift: activeShift || null,
    };
  }

  /**
   * Create a volunteer_shifts record (clock-in).
   */
  async volunteerCheckIn(volunteerAuthId: string, applicationId: string, campaignId?: string) {
    this.logger.log(`[Deployment] Clock-in for volunteer ${volunteerAuthId}`);

    // Prevent double check-in
    const { data: existing } = await this.client
      .from('volunteer_shifts')
      .select('id')
      .eq('volunteer_auth_id', volunteerAuthId)
      .eq('application_id', applicationId)
      .is('clock_out', null)
      .maybeSingle();

    if (existing) {
      return existing; // Already checked in – return existing shift
    }

    const { data: shift, error } = await this.client
      .from('volunteer_shifts')
      .insert([{
        volunteer_auth_id: volunteerAuthId,
        application_id: applicationId,
        campaign_id: campaignId || null,
        clock_in: new Date().toISOString(),
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw new Error(`Check-in error: ${error.message}`);
    return shift;
  }

  /**
   * Update the status of a single task assignment.
   */
  async updateTaskStatus(taskId: string, newStatus: string) {
    const updatePayload: any = { status: newStatus };
    if (newStatus === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.client
      .from('volunteer_task_assignments')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw new Error(`Task update error: ${error.message}`);
    return data;
  }

  /**
   * Record clock-out and compute total hours.
   */
  async volunteerClockOut(shiftId: string, notes?: string) {
    this.logger.log(`[Deployment] Clock-out for shift ${shiftId}`);

    // Fetch the shift to compute hours and get application_id
    const { data: shift, error: fetchErr } = await this.client
      .from('volunteer_shifts')
      .select('clock_in, application_id')
      .eq('id', shiftId)
      .single();

    if (fetchErr || !shift) throw new Error(`Shift not found: ${fetchErr?.message}`);

    const clockIn = new Date(shift.clock_in);
    const clockOut = new Date();
    const totalHours = parseFloat(((clockOut.getTime() - clockIn.getTime()) / 3600000).toFixed(2));

    const { data, error } = await this.client
      .from('volunteer_shifts')
      .update({
        clock_out: clockOut.toISOString(),
        total_hours: totalHours,
        notes: notes || null,
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw new Error(`Clock-out error: ${error.message}`);

    // Mark the linked deployment as 'completed'
    if (shift.application_id) {
      await this.client
        .from('volunteer_deployments')
        .update({ status: 'completed' })
        .eq('application_id', shift.application_id)
        .in('status', ['active', 'assigned']);
      this.logger.log(`[Deployment] Marked deployment for application ${shift.application_id} as completed`);
    }

    return data;
  }

  /**
   * Post the final shift summary and mark it for supervisor approval.
   */
  async postShiftSummary(shiftId: string, summary: string) {
    const { data, error } = await this.client
      .from('volunteer_shifts')
      .update({ notes: summary })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw new Error(`Summary post error: ${error.message}`);
    return data;
  }
}
