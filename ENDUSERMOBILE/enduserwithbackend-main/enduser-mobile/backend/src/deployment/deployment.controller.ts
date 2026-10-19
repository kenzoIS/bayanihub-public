import {
  Controller, Get, Post, Put, Body, Param, UseGuards, Req,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Request } from 'express';

@Controller('deployment')
@UseGuards(SupabaseAuthGuard)
export class DeploymentController {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * GET /deployment/my-info
   * Fetch the volunteer's active deployment and tasks for a given application.
   */
  @Get('my-info/:applicationId')
  async getMyDeploymentInfo(@Param('applicationId') applicationId: string, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getDeploymentInfo(applicationId, user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /deployment/check-in
   * Record volunteer clock-in time in volunteer_shifts.
   */
  @Post('check-in')
  async checkIn(@Body() body: { applicationId: string; campaignId?: string }, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.volunteerCheckIn(user.id, body.applicationId, body.campaignId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * PUT /deployment/task/:taskId
   * Update a single task assignment status.
   */
  @Put('task/:taskId')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() body: { status: string },
    @Req() req: Request,
  ) {
    try {
      const result = await this.supabaseService.updateTaskStatus(taskId, body.status);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /deployment/clock-out
   * Record volunteer clock-out time and compute total hours.
   */
  @Post('clock-out')
  async clockOut(@Body() body: { shiftId: string; notes?: string }, @Req() req: Request) {
    try {
      const result = await this.supabaseService.volunteerClockOut(body.shiftId, body.notes);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /deployment/summary
   * Post the final shift summary/notes and mark shift as complete.
   */
  @Post('summary')
  async postSummary(@Body() body: { shiftId: string; summary: string }, @Req() req: Request) {
    try {
      const result = await this.supabaseService.postShiftSummary(body.shiftId, body.summary);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
