import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase';
import { GenerateQrDto, QrType } from './dto/generate-qr.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  private readonly BUCKET = 'qr-codes';

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Generate a QR code PNG for an approved volunteer application.
   * The QR payload contains volunteer info so site managers can scan it.
   * The PNG is uploaded to Supabase Storage and a record is saved in qr_codes table.
   */
  async generate(dto: GenerateQrDto, generatedByUserId: string | null) {
    if (!dto.application_id && !dto.donation_id) {
      throw new BadRequestException('Either application_id or donation_id must be provided');
    }

    let payload: any;
    let fileName: string;
    let filePath: string;
    let dbRecord: any = {
      qr_type: dto.qr_type,
      generated_by: generatedByUserId,
      campaign_id: dto.campaign_id ?? null,
    };

    if (dto.application_id) {
      // 1. Fetch the application with profile + role
      const { data: application, error: appErr } = await this.supabase
        .from('volunteer_applications')
        .select('id, status, volunteer_auth_id, role_id, applied_at')
        .eq('id', dto.application_id)
        .single();

      if (appErr || !application) throw new NotFoundException('Application not found');
      if (application.status !== 'approved') throw new BadRequestException('QR codes can only be generated for approved applications');

      // 2. Fetch volunteer profile
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('auth_user_id, first_name, last_name, phone, address, barangay, municipality, province, role')
        .eq('auth_user_id', application.volunteer_auth_id)
        .single();

      if (!profile) throw new NotFoundException('Volunteer profile not found');

      // 3. Fetch volunteer role
      const { data: volRole } = await this.supabase
        .from('volunteer_roles')
        .select('id, title, campaign_id, location, start_date, end_date')
        .eq('id', application.role_id)
        .single();

      // 4. Fetch campaign if available
      let campaign: any = null;
      const campaignId = dto.campaign_id || volRole?.campaign_id;
      if (campaignId) {
        const { data: campData } = await this.supabase
          .from('bh_campaigns')
          .select('id, title, description, type, status')
          .eq('id', campaignId)
          .single();
        campaign = campData;
        dbRecord.campaign_id = campaignId;
      }

      // 5. Build QR payload
      payload = {
        type: dto.qr_type,
        application_id: application.id,
        volunteer: {
          name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
          phone: profile.phone ?? '',
          address: profile.municipality
            ? `${profile.barangay ?? ''}, ${profile.municipality}, ${profile.province ?? ''}`.replace(/^, |, $/g, '')
            : profile.address ?? '',
        },
        role: volRole?.title ?? 'Volunteer',
        campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
        deployment: volRole
          ? {
              location: volRole.location,
              start_date: volRole.start_date,
              end_date: volRole.end_date,
            }
          : null,
        issued_at: new Date().toISOString(),
      };

      dbRecord.application_id = application.id;
      dbRecord.volunteer_auth_id = application.volunteer_auth_id;
      fileName = `${dto.qr_type}_app_${application.id}_${Date.now()}.png`;

    } else if (dto.donation_id) {
      // 1. Fetch the donation
      const { data: donation, error: donErr } = await this.supabase
        .from('donations')
        .select('id, status, donor_auth_id, campaign_id, item_name, quantity, unit')
        .eq('id', dto.donation_id)
        .single();

      if (donErr || !donation) throw new NotFoundException('Donation not found');

      // 2. Fetch donor profile if auth ID exists
      let profile: any = null;
      if (donation.donor_auth_id) {
        const { data: profileData } = await this.supabase
          .from('user_profiles')
          .select('auth_user_id, first_name, last_name, phone, address, barangay, municipality, province')
          .eq('auth_user_id', donation.donor_auth_id)
          .single();
        profile = profileData;
      }

      // 3. Fetch campaign if available
      let campaign: any = null;
      const campaignId = dto.campaign_id || donation.campaign_id;
      if (campaignId) {
        const { data: campData } = await this.supabase
          .from('bh_campaigns')
          .select('id, title, description, type, status')
          .eq('id', campaignId)
          .single();
        campaign = campData;
        dbRecord.campaign_id = campaignId;
      }

      // 4. Build QR payload for donation
      payload = {
        type: 'drop_off',
        donation_id: donation.id,
        donor: {
          name: profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : 'Anonymous Donor',
          phone: profile?.phone ?? '',
          address: profile?.municipality
            ? `${profile.barangay ?? ''}, ${profile.municipality}, ${profile.province ?? ''}`.replace(/^, |, $/g, '')
            : profile?.address ?? '',
        },
        donation_details: {
          item: donation.item_name ?? 'Donation Item',
          quantity: donation.quantity ?? 1,
          unit: donation.unit ?? 'pcs',
        },
        campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
        issued_at: new Date().toISOString(),
      };

      dbRecord.donation_id = donation.id;
      dbRecord.donor_auth_id = donation.donor_auth_id;
      fileName = `drop_off_don_${donation.id}_${Date.now()}.png`;
    }

    filePath = `${dto.qr_type}/${fileName}`;

    // 6. Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(JSON.stringify(payload), {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });

    // 7. Upload to Supabase Storage
    const { error: uploadErr } = await this.supabase.storage
      .from(this.BUCKET)
      .upload(filePath, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadErr) {
      throw new BadRequestException(`Failed to upload QR code: ${uploadErr.message}`);
    }

    // 8. Get public URL
    const { data: urlData } = this.supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 9. Save record in qr_codes table
    dbRecord.payload = payload;
    dbRecord.storage_path = filePath;
    dbRecord.public_url = publicUrl;

    const { data: qrRecord, error: insertErr } = await this.supabase
      .from('qr_codes')
      .insert(dbRecord)
      .select()
      .single();

    if (insertErr) {
      throw new BadRequestException(`Failed to save QR record: ${insertErr.message}`);
    }

    return {
      id: qrRecord.id,
      qr_type: dto.qr_type,
      public_url: publicUrl,
      payload,
      generated_at: qrRecord.created_at,
    };
  }

  /**
   * Get all QR codes for an application.
   */
  async findByApplication(applicationId: string) {
    const { data, error } = await this.supabase
      .from('qr_codes')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get all QR codes for a donation.
   */
  async findByDonation(donationId: string) {
    const { data, error } = await this.supabase
      .from('qr_codes')
      .select('*')
      .eq('donation_id', donationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get a single QR code by ID.
   */
  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('QR code not found');
    return data;
  }
}
