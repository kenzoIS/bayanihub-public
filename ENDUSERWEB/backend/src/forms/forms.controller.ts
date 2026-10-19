import { Body, Controller, HttpException, HttpStatus, Patch, Post, Get, UseGuards, Req, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Request } from 'express';

@Controller('forms')
export class FormsController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('campaigns')
  async getCampaigns() {
    try {
      const result = await this.supabaseService.getActiveCampaigns();
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('campaigns/volunteer')
  async getVolunteerCampaigns() {
    try {
      const result = await this.supabaseService.getVolunteerCampaigns();
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('volunteer')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('resume', { limits: { fileSize: 10 * 1024 * 1024 } })) // 10MB Limit
  async submitVolunteer(
    @Body() volunteerData: any, 
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.insertVolunteerApplication(volunteerData, user.id, file);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('donation')
  @UseGuards(SupabaseAuthGuard)
  async submitDonation(@Body() donationData: any, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.insertDonation(donationData, user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-application')
  @UseGuards(SupabaseAuthGuard)
  async getMyApplication(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getLatestApplication(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-applications')
  @UseGuards(SupabaseAuthGuard)
  async getMyApplications(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getAllApplications(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-mission')
  @UseGuards(SupabaseAuthGuard)
  async getMyMission(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getMyMission(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-missions')
  @UseGuards(SupabaseAuthGuard)
  async getMyMissions(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getMyMissions(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-missions/:applicationId')
  @UseGuards(SupabaseAuthGuard)
  async getMyMissionByApplication(@Param('applicationId') applicationId: string, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getMyMission(user.id, applicationId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('my-mission/start')
  @UseGuards(SupabaseAuthGuard)
  async startMyMission(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.startMyMission(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('my-missions/:applicationId/start')
  @UseGuards(SupabaseAuthGuard)
  async startMyMissionByApplication(@Param('applicationId') applicationId: string, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.startMyMission(user.id, applicationId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('my-mission/task-status')
  @UseGuards(SupabaseAuthGuard)
  async updateMyMissionTaskStatus(
    @Body() body: { status?: 'in_progress' | 'completed' },
    @Req() req: Request,
  ) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.updateMyMissionTaskStatus(user.id, body.status);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('my-missions/:applicationId/task-status')
  @UseGuards(SupabaseAuthGuard)
  async updateMyMissionTaskStatusByApplication(
    @Param('applicationId') applicationId: string,
    @Body() body: { status?: 'in_progress' | 'completed' },
    @Req() req: Request,
  ) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.updateMyMissionTaskStatus(user.id, body.status, applicationId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('my-mission/clock-out')
  @UseGuards(SupabaseAuthGuard)
  async requestMyMissionClockOut(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.requestMyMissionClockOut(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('my-missions/:applicationId/clock-out')
  @UseGuards(SupabaseAuthGuard)
  async requestMyMissionClockOutByApplication(@Param('applicationId') applicationId: string, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.requestMyMissionClockOut(user.id, applicationId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('my-mission/summary')
  @UseGuards(SupabaseAuthGuard)
  async getMyMissionSummary(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getMyMission(user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('my-missions/:applicationId/summary')
  @UseGuards(SupabaseAuthGuard)
  async getMyMissionSummaryByApplication(@Param('applicationId') applicationId: string, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.getMyMission(user.id, applicationId);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
