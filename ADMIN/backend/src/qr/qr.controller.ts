import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QrService } from './qr.service';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  /**
   * POST /api/v1/qr/generate
   * Generate a QR code for an approved volunteer application.
   */
  @Post('generate')
  generate(@Body() dto: GenerateQrDto, @Req() req: any) {
    return this.qrService.generate(dto, req.user?.id ?? null);
  }

  /**
   * GET /api/v1/qr/application/:applicationId
   * Get all QR codes for a specific application.
   */
  @Get('application/:applicationId')
  findByApplication(@Param('applicationId') applicationId: string) {
    return this.qrService.findByApplication(applicationId);
  }

  /**
   * GET /api/v1/qr/donation/:donationId
   * Get all QR codes for a specific donation.
   */
  @Get('donation/:donationId')
  findByDonation(@Param('donationId') donationId: string) {
    return this.qrService.findByDonation(donationId);
  }

  /**
   * GET /api/v1/qr/:id
   * Get a single QR code record.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qrService.findOne(id);
  }
}
