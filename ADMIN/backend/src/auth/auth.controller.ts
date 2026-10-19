import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Admin-only login. Returns access_token + profile on success.
   */
  @Post('login')
  async login(@Body() dto: LoginAdminDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/v1/auth/profile
   * Protected — requires valid Supabase JWT with admin role.
   */
  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.getProfile(user.id);
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Generates a 6-digit OTP and logs it to console (dev mode).
   * Always returns a generic response to prevent email enumeration.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /api/v1/auth/verify-otp
   * Validates the 6-digit OTP code sent to the admin email.
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Updates the admin password via the Supabase Admin SDK.
   * Requires a valid OTP for double security.
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
