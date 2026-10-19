import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();
  private transporter: nodemailer.Transporter;

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(this.config.get('SMTP_PORT')) || 587,
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get('SMTP_USER') || '',
        pass: this.config.get('SMTP_PASS') || '',
      },
    });
  }

  async sendOtp(email: string) {
    // Generate a 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store with 10 mins expiry
    this.otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    try {
      const smtpUser = this.config.get('SMTP_USER') || 'noreply@bayanihub.ph';
      await this.transporter.sendMail({
        from: `"BayaniHub Security" <${smtpUser}>`,
        to: email,
        subject: 'Your BayaniHub Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>BayaniHub Security Verification</h2>
            <p>Your 6-digit verification code is:</p>
            <h1 style="letter-spacing: 5px; color: #5E70DC;">${otp}</h1>
            <p>This code will expire in 10 minutes. Please do not share it with anyone.</p>
          </div>
        `,
      });
      this.logger.log(`Sent OTP to ${email}`);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}`, error);
      throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyOtp(email: string, otp: string) {
    const record = this.otpStore.get(email);
    if (!record) {
      throw new HttpException('No OTP found or expired', HttpStatus.BAD_REQUEST);
    }
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email);
      throw new HttpException('OTP has expired', HttpStatus.BAD_REQUEST);
    }
    if (record.otp !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }
    
    // Valid OTP
    return { success: true };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    await this.verifyOtp(email, otp);

    const client = this.supabase.getClient();
    // 1. Get user by email by using the Auth Admin API
    const { data: usersData, error: userError } = await client.auth.admin.listUsers();
    
    if (userError || !usersData) {
      throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const user = usersData.users.find((u: any) => u.email === email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // 2. Update password
    const { error: updateError } = await client.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new HttpException(updateError.message, HttpStatus.BAD_REQUEST);
    }

    // Success, clear OTP
    this.otpStore.delete(email);
    return { success: true, message: 'Password updated successfully' };
  }
}
