import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';

// ─── In-memory OTP store (email → { code, expiresAt }) ─────────────────────
interface OtpEntry {
  code: string;
  expiresAt: number;   // Unix timestamp in ms
  attempts: number;    // failed verification attempts
}

const OTP_STORE = new Map<string, OtpEntry>();
const OTP_TTL_MS = 10 * 60 * 1000;   // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly smtpConfigured: boolean;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {
    // ── Configure Nodemailer transporter ──────────────────────────────
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');

    this.smtpConfigured = !!(
      smtpHost &&
      smtpUser &&
      smtpPass &&
      smtpPass !== 'YOUR_GMAIL_APP_PASSWORD_HERE'
    );

    this.transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: Number(this.config.get<string>('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for 587
      auth: {
        user: smtpUser || '',
        pass: smtpPass || '',
      },
    });

    if (this.smtpConfigured) {
      this.logger.log('SMTP configured — OTP emails will be sent.');
    } else {
      this.logger.warn(
        'SMTP not configured (SMTP_PASS is placeholder). OTP codes will be logged to console only.',
      );
    }
  }

  // ───────────────────── SEND OTP EMAIL ─────────────────────

  private async sendOtpEmail(email: string, code: string): Promise<void> {
    const fromAddr =
      this.config.get<string>('SMTP_FROM') ||
      `"BayaniHub Admin" <${this.config.get<string>('SMTP_USER')}>`;

    const html = `
      <div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <h1 style="color:#5C6ED5;font-size:1.5rem;margin:0;">BayaniHub Admin</h1>
          <p style="color:#737373;font-size:0.875rem;margin:0.25rem 0 0;">DRRM Platform — Password Recovery</p>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0.75rem;padding:1.5rem;text-align:center;">
          <p style="color:#374151;font-size:0.95rem;margin:0 0 1rem;">Your one-time password (OTP) is:</p>
          <div style="background:#ffffff;border:2px solid #5C6ED5;border-radius:0.5rem;padding:1rem;display:inline-block;">
            <span style="font-size:2rem;font-weight:700;letter-spacing:0.5rem;color:#1f2937;">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:0.8rem;margin:1rem 0 0;">
            This code expires in <strong>10 minutes</strong>.<br/>
            If you did not request this, please ignore this email.
          </p>
        </div>
        <p style="color:#9ca3af;font-size:0.75rem;text-align:center;margin-top:1rem;">
          This is an automated message from BayaniHub Admin Portal.<br/>
          Do not reply to this email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: fromAddr,
        to: email,
        subject: `Your BayaniHub Admin OTP: ${code}`,
        html,
      });
      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${email}: ${err.message}`);
      // Don't throw — we still want the flow to continue (code is logged to console as fallback)
    }
  }

  // ───────────────────── LOGIN ─────────────────────

  async login(dto: LoginAdminDto) {
    const anonClient = createClient(
      this.supabase.getUrl(),
      this.supabase.getAnonKey(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      this.logger.warn(`Admin login failed for ${dto.email}: ${error.message}`);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new UnauthorizedException('Email not confirmed.');
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { data: profile } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      this.logger.warn(`Non-admin login attempt: ${dto.email}`);
      throw new ForbiddenException('Access denied. Admin accounts only.');
    }

    this.logger.log(`Admin login success: ${dto.email}`);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile,
      },
    };
  }

  // ───────────────────── GET PROFILE (protected) ─────────────────────

  async getProfile(authUserId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !data) {
      throw new BadRequestException('Profile not found.');
    }

    return data;
  }

  // ───────────────────── FORGOT PASSWORD (generate & send OTP) ─────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.listUsers();

    if (error) {
      this.logger.error(`listUsers failed: ${error.message}`);
      throw new InternalServerErrorException('Could not process request.');
    }

    const user = data.users.find((u) => u.email === dto.email);

    if (user) {
      const { data: profile } = await this.supabase
        .getClient()
        .from('user_profiles')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (profile?.role === 'admin') {
        // Generate a 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + OTP_TTL_MS;

        // Store it keyed by email (overwrites any previous unredeemed OTP)
        OTP_STORE.set(dto.email.toLowerCase(), { code, expiresAt, attempts: 0 });

        // ── Always log to console as fallback ──────────────────────────
        this.logger.log(`═══════════════════════════════════════`);
        this.logger.log(`  OTP for ${dto.email}: ${code}`);
        this.logger.log(`  Expires at: ${new Date(expiresAt).toISOString()}`);
        this.logger.log(`═══════════════════════════════════════`);

        // ── Send OTP via email if SMTP is configured ────────────────
        if (this.smtpConfigured) {
          await this.sendOtpEmail(dto.email, code);
        }
      } else {
        this.logger.warn(
          `Forgot-password requested for non-admin: ${dto.email}`,
        );
      }
    }

    // Generic response — prevents email enumeration
    return {
      message: 'If that admin email is registered, a code has been sent.',
    };
  }

  // ───────────────────── VERIFY OTP ─────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const key = dto.email.toLowerCase();
    const entry = OTP_STORE.get(key);

    if (!entry) {
      throw new BadRequestException('No OTP was requested for this email. Please request a new code.');
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      OTP_STORE.delete(key);
      throw new BadRequestException('OTP has expired. Please request a new code.');
    }

    // Check attempts
    if (entry.attempts >= MAX_OTP_ATTEMPTS) {
      OTP_STORE.delete(key);
      throw new BadRequestException('Too many failed attempts. Please request a new code.');
    }

    // Check code
    if (entry.code !== dto.code) {
      entry.attempts += 1;
      throw new BadRequestException('Invalid OTP code. Please try again.');
    }

    // OTP is valid — mark as verified but keep it so resetPassword can double-check
    this.logger.log(`OTP verified successfully for: ${dto.email}`);
    return { verified: true, message: 'OTP verified successfully.' };
  }

  // ───────────────────── RESET PASSWORD ─────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    // First verify the OTP again (double security)
    const key = dto.email.toLowerCase();
    const entry = OTP_STORE.get(key);

    if (!entry) {
      throw new BadRequestException('No OTP was requested for this email.');
    }
    if (Date.now() > entry.expiresAt) {
      OTP_STORE.delete(key);
      throw new BadRequestException('OTP has expired. Please request a new code.');
    }
    if (entry.code !== dto.otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    // OTP valid — proceed with password reset
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.listUsers();

    if (error) {
      this.logger.error(`listUsers failed: ${error.message}`);
      throw new InternalServerErrorException('Could not process request.');
    }

    const user = data.users.find((u) => u.email === dto.email);

    if (!user) {
      throw new BadRequestException('No account found with that email.');
    }

    const { data: profile } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new ForbiddenException('Access denied. Admin accounts only.');
    }

    const { error: updateError } = await this.supabase
      .getClient()
      .auth.admin.updateUserById(user.id, { password: dto.newPassword });

    if (updateError) {
      this.logger.error(`Password reset failed: ${updateError.message}`);
      throw new InternalServerErrorException('Could not reset password.');
    }

    // Consume the OTP — it can't be reused
    OTP_STORE.delete(key);

    this.logger.log(`Password reset successful for admin: ${dto.email}`);
    return { message: 'Password has been reset successfully.' };
  }
}
