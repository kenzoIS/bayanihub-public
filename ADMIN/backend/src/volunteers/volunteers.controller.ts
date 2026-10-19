import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { FilterVolunteerRolesDto } from './dto/volunteers.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  /**
   * GET /volunteers/roles
   * List volunteer roles with optional filters.
   */
  @Get('roles')
  findRoles(@Query() filters: FilterVolunteerRolesDto) {
    return this.volunteersService.findRoles(filters);
  }

  /**
   * GET /volunteers/stats
   * Dashboard statistics for volunteer applications.
   */
  @Get('stats')
  getStats() {
    return this.volunteersService.getStats();
  }

  /**
   * GET /volunteers/verify/:authUserId
   * Check if a user is a verified volunteer.
   */
  @Get('verify/:authUserId')
  verifyVolunteer(@Param('authUserId') authUserId: string) {
    return this.volunteersService.verifyVolunteer(authUserId);
  }

  /**
   * GET /volunteers/search?q=...
   * Search user profiles by name to check volunteer status.
   */
  @Get('search')
  searchVolunteers(@Query('q') search: string) {
    return this.volunteersService.searchVolunteers(search ?? '');
  }

  /**
   * GET /volunteers/roles/:id
   * Get a single volunteer role.
   */
  @Get('roles/:id')
  findRole(@Param('id') id: string) {
    return this.volunteersService.findRole(id);
  }

  /**
   * GET /volunteers/deployments/:applicationId
   * List deployments for a given application.
   */
  @Get('deployments/:applicationId')
  getDeployments(@Param('applicationId') applicationId: string) {
    return this.volunteersService.getDeployments(applicationId);
  }
}
