import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class QrScanService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Look up a QR code record by application_id and return
   * the full volunteer deployment details for the site manager.
   */
  async verifyQr(id: string) {
    const client = this.supabase.getClient();

    // 1. Find the QR code record by either application_id or donation_id
    const { data: qrRecord, error: qrErr } = await client
      .from('qr_codes')
      .select('*')
      .or(`application_id.eq.${id},donation_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (qrErr || !qrRecord) {
      throw new NotFoundException('QR code not found for this ID');
    }

    if (qrRecord.donation_id) {
       // --- DONATION DROP OFF ---
       const { data: donation } = await client
         .from('donations')
         .select('id, status, donor_auth_id, item_name, quantity, unit')
         .eq('id', qrRecord.donation_id)
         .single();
         
       let profile: any = null;
       if (qrRecord.donor_auth_id) {
         const { data } = await client
           .from('user_profiles')
           .select('first_name, last_name, phone, address, barangay, municipality, province')
           .eq('auth_user_id', qrRecord.donor_auth_id)
           .single();
         profile = data;
       }
         
       let campaign: any = null;
       if (qrRecord.campaign_id) {
         const { data } = await client.from('bh_campaigns').select('id, title, status').eq('id', qrRecord.campaign_id).single();
         campaign = data;
       }
       
       return {
         verified: true,
         qr_type: qrRecord.qr_type,
         issued_at: qrRecord.created_at,
         volunteer: null, // It's a donor
         donor: profile
           ? {
               name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
               phone: profile.phone ?? '',
               address: profile.municipality
                 ? `${profile.barangay ?? ''}, ${profile.municipality}, ${profile.province ?? ''}`.replace(/^, |, $/g, '')
                 : profile.address ?? '',
             }
           : null,
         donation_details: donation ? {
           id: donation.id,
           item: donation.item_name ?? 'Donation Item',
           quantity: donation.quantity ?? 1,
           unit: donation.unit ?? 'pcs',
         } : null,
         role: 'Donor',
         campaign: campaign
           ? { id: campaign.id, title: campaign.title, status: campaign.status }
           : null,
         deployment: null,
         application_status: donation?.status ?? 'unknown',
       };

    } else {
       // --- VOLUNTEER DEPLOYMENT ---
       const { data: profile } = await client
         .from('user_profiles')
         .select('auth_user_id, first_name, last_name, phone, address, barangay, municipality, province, profile_photo_key, role')
         .eq('auth_user_id', qrRecord.volunteer_auth_id)
         .single();

       const { data: application } = await client
         .from('volunteer_applications')
         .select('id, role_id, status, applied_at')
         .eq('id', qrRecord.application_id)
         .single();

       let volRole: any = null;
       if (application?.role_id) {
         const { data } = await client
           .from('volunteer_roles')
           .select('id, title, campaign_id, location, start_date, end_date, status')
           .eq('id', application.role_id)
           .single();
         volRole = data;
       }

       let campaign: any = null;
       const campaignId = qrRecord.campaign_id || volRole?.campaign_id;
       if (campaignId) {
         const { data } = await client
           .from('bh_campaigns')
           .select('id, title, description, type, status')
           .eq('id', campaignId)
           .single();
         campaign = data;
       }

       return {
         verified: true,
         qr_type: qrRecord.qr_type,
         issued_at: qrRecord.created_at,
         donor: null,
         volunteer: profile
           ? {
               name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
               phone: profile.phone ?? '',
               address: profile.municipality
                 ? `${profile.barangay ?? ''}, ${profile.municipality}, ${profile.province ?? ''}`.replace(/^, |, $/g, '')
                 : profile.address ?? '',
               role_in_system: profile.role,
             }
           : null,
         role: volRole?.title ?? 'Volunteer',
         campaign: campaign
           ? { id: campaign.id, title: campaign.title, status: campaign.status }
           : null,
         deployment: volRole
           ? {
               location: volRole.location,
               start_date: volRole.start_date,
               end_date: volRole.end_date,
               status: volRole.status,
             }
           : null,
         application_status: application?.status ?? 'unknown',
       };
    }
  }

  async reconcileDonation(dto: { donation_id: string; item_name: string; quantity: number; unit: string; donation_type: string }) {
    const client = this.supabase.getClient();

    // Fetch existing donation to check campaign_id
    const { data: existing, error: fetchErr } = await client
      .from('donations')
      .select('id, status, campaign_id, quantity')
      .eq('id', dto.donation_id)
      .single();

    if (fetchErr || !existing) {
      throw new NotFoundException('Donation not found');
    }

    // Update donation with reconciled items and set status to completed
    const { data: updated, error: updateErr } = await client
      .from('donations')
      .update({
        item_name: dto.item_name,
        quantity: dto.quantity,
        unit: dto.unit,
        status: 'completed',
      })
      .eq('id', dto.donation_id)
      .select()
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // If it's newly completed and linked to a campaign, update campaign current_amount
    if (existing.status !== 'completed' && existing.campaign_id) {
      const { data: campaign } = await client
        .from('bh_campaigns')
        .select('id, current_amount')
        .eq('id', existing.campaign_id)
        .single();

      if (campaign) {
        const newAmount = Number(campaign.current_amount ?? 0) + Number(dto.quantity ?? 0);
        await client
          .from('bh_campaigns')
          .update({ current_amount: newAmount })
          .eq('id', campaign.id);
      }
    }

    return updated;
  }
}
