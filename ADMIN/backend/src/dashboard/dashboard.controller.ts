import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** GET /api/v1/dashboard — combined stats + recent activity */
  @Get()
  getDashboard() {
    return this.dashboardService.getDashboard();
  }

  /** GET /api/dashboard/stats */
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  /** GET /api/dashboard/recent-activity */
  @Get('recent-activity')
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}
