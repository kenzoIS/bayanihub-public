import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * GET /documents/application/:applicationId
   * Get signed URL for an application's uploaded resume/document.
   */
  @Get('application/:applicationId')
  getApplicationDocument(@Param('applicationId') applicationId: string) {
    return this.documentsService.getApplicationDocument(applicationId);
  }

  /**
   * GET /documents/profile-photo/:authUserId
   * Get signed URL for a user's profile photo.
   */
  @Get('profile-photo/:authUserId')
  getProfilePhoto(@Param('authUserId') authUserId: string) {
    return this.documentsService.getProfilePhoto(authUserId);
  }

  /**
   * GET /documents/campaign-cover/:campaignId
   * Get signed URL for a campaign cover image.
   */
  @Get('campaign-cover/:campaignId')
  getCampaignCover(@Param('campaignId') campaignId: string) {
    return this.documentsService.getCampaignCover(campaignId);
  }

  /**
   * GET /documents/signed-url?bucket=...&key=...
   * Get a generic signed URL for any file in Supabase Storage.
   */
  @Get('signed-url')
  getSignedUrl(
    @Query('bucket') bucket: string,
    @Query('key') key: string,
  ) {
    return this.documentsService.getSignedUrl(bucket, key);
  }

  /**
   * GET /documents/files?bucket=...&folder=...
   * List files in a bucket (admin review).
   */
  @Get('files')
  listFiles(
    @Query('bucket') bucket: string,
    @Query('folder') folder?: string,
  ) {
    return this.documentsService.listFiles(bucket, folder);
  }
}
