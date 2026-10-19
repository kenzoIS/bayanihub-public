import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  FilterApplicationsDto,
  ReviewApplicationDto,
} from './dto/applications.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * GET /applications
   * View Volunteer Application Queue, with optional filters by role/status/search.
   */
  @Get()
  findAll(@Query() filters: FilterApplicationsDto) {
    return this.applicationsService.findAll(filters);
  }

  /**
   * GET /applications/roles
   * List available volunteer roles for filtering.
   */
  @Get('roles')
  getRoles(@Query('campaign_id') campaignId?: string) {
    return this.applicationsService.getRoles(campaignId);
  }

  /**
   * GET /applications/:id
   * View single application with full applicant details and documents.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  /**
   * PATCH /applications/:id/review
   * Approve or Reject an application.
   */
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @Req() req: any,
  ) {
    return this.applicationsService.review(id, dto, req.user?.id ?? null);
  }
}
