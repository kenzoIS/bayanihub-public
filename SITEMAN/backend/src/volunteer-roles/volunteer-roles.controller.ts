import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { VolunteerRolesService } from './volunteer-roles.service';

@Controller('volunteer-roles')
export class VolunteerRolesController {
  constructor(private readonly service: VolunteerRolesService) {}

  @Get()
  findAll(
    @Query('campaign_id') campaignId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(campaignId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
