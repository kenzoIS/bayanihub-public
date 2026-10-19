import {
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { FilterCampaignsDto, UpdateCampaignDto } from './dto/campaigns.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  /**
   * GET /campaigns
   * Review Donation Inventory - list campaigns with Items, Sites, Date, Time.
   */
  @Get()
  findAll(@Query() filters: FilterCampaignsDto) {
    return this.campaignsService.findAll(filters);
  }

  /**
   * GET /campaigns/stats
   * Dashboard statistics for campaigns.
   */
  @Get('stats')
  getStats() {
    return this.campaignsService.getStats();
  }

  /**
   * GET /campaigns/:id
   * Get a single campaign with full details + donations.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  /**
   * PATCH /campaigns/:id
   * Update a campaign used in the donation inventory view.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  /**
   * DELETE /campaigns/:id
   * Remove a campaign from the donation inventory.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
