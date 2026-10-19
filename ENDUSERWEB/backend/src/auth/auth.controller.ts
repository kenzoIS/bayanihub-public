import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   *
   * Accepts multipart/form-data with:
   *   - All CreateUserDto fields as text fields
   *   - `id_document` as a file field (JPG / PNG / PDF, max 10 MB)
   *
   * The FileValidationPipe validates MIME type, size, and magic bytes
   * BEFORE the service layer is reached.
   */
  @Post('register')
  @UseInterceptors(
    FileInterceptor('id_document', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit at Multer level
    }),
  )
  async register(
    @Body() dto: CreateUserDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    return this.authService.register(dto, file);
  }

  /**
   * POST /api/v1/auth/login
   *
   * Returns { access_token, refresh_token, user } on success.
   */
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/v1/auth/profile
   *
   * Protected route — requires a valid Supabase JWT in the
   * Authorization: Bearer <token> header.
   */
  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.getProfile(user.id);
  }

  /**
   * POST /api/v1/auth/forgot-password
   *
   * Accepts { email }. Validates the email and returns a generic
   * success message. OTP is mocked on the frontend for now.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /api/v1/auth/reset-password
   *
   * Accepts { email, newPassword }. Uses the admin API to update
   * the user's password directly in Supabase Auth.
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
