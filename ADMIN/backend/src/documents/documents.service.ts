import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Get a signed URL for a document stored in Supabase Storage.
   * Used to review uploaded resumes, IDs, certifications, etc.
   *
   * @param bucket - The storage bucket name (e.g. 'resumes', 'documents', 'profile-photos')
   * @param key - The file path/key within the bucket
   * @param expiresIn - URL expiry in seconds (default 1 hour)
   */
  async getSignedUrl(bucket: string, key: string, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(key, expiresIn);

    if (error) throw error;
    if (!data?.signedUrl) {
      throw new NotFoundException('Document not found');
    }

    return { signed_url: data.signedUrl };
  }

  /**
   * Get the resume/document URL for a specific volunteer application.
   * The resume_key field on volunteer_applications stores the bucket path.
   */
  async getApplicationDocument(applicationId: string) {
    const { data: application, error } = await this.supabase
      .from('volunteer_applications')
      .select('resume_key')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      throw new NotFoundException('Application not found');
    }

    if (!application.resume_key) {
      return { signed_url: null, message: 'No document uploaded' };
    }

    return this.getSignedUrl('resumes', application.resume_key);
  }

  /**
   * Get profile photo URL for a user.
   */
  async getProfilePhoto(authUserId: string) {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('profile_photo_key')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !profile) {
      throw new NotFoundException('User profile not found');
    }

    if (!profile.profile_photo_key) {
      return { signed_url: null, message: 'No profile photo uploaded' };
    }

    return this.getSignedUrl('profile-photos', profile.profile_photo_key);
  }

  /**
   * Get campaign cover image URL.
   */
  async getCampaignCover(campaignId: string) {
    const { data: campaign, error } = await this.supabase
      .from('bh_campaigns')
      .select('cover_image_key')
      .eq('id', campaignId)
      .single();

    if (error || !campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.cover_image_key) {
      return { signed_url: null, message: 'No cover image uploaded' };
    }

    return this.getSignedUrl('campaign-covers', campaign.cover_image_key);
  }

  /**
   * List all files in a specific bucket path (for admin review).
   */
  async listFiles(bucket: string, folder?: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(folder ?? '', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;
    return data;
  }
}
