import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { MissionsService, ActivateMissionDto } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly service: MissionsService) {}

  /** POST /api/missions/activate — activate a new mission session */
  @Post('activate')
  activate(
    @Body() dto: ActivateMissionDto & { activated_by?: string },
  ) {
    const { activated_by, ...missionDto } = dto;
    return this.service.activateMission(missionDto, activated_by ?? 'site-manager');
  }

  /** POST /api/missions/assign — assign selected volunteers to a campaign */
  @Post('assign')
  assignVolunteers(
    @Body() body: { application_ids: string[]; campaign_id: string; notes?: string },
  ) {
    return this.service.assignVolunteers(body.application_ids, body.campaign_id, body.notes);
  }

  /** GET /api/missions/volunteer-summary — real-time volunteer summary */
  @Get('volunteer-summary')
  getVolunteerSummary(@Query('campaign_id') campaignId?: string) {
    return this.service.getVolunteerSummary(campaignId);
  }

  /** GET /api/missions/report — Final Mission Report */
  @Get('report')
  getFinalReport(@Query('campaign_id') campaignId?: string) {
    return this.service.getFinalReport(campaignId);
  }
}
