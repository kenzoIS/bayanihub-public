import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { QrScanService } from './qr-scan.service';

@Controller('qr-scan')
export class QrScanController {
  constructor(private readonly qrScanService: QrScanService) {}

  /**
   * GET /api/v1/qr-scan/:id
   * Site manager scans a QR code → frontend extracts application_id or donation_id → calls this.
   * Returns full details for verification.
   */
  @Get(':id')
  verify(@Param('id') id: string) {
    return this.qrScanService.verifyQr(id);
  }

  /**
   * POST /api/v1/qr-scan/reconcile
   * Reconcile a donation.
   */
  @Post('reconcile')
  reconcile(@Body() body: { donation_id: string; item_name: string; quantity: number; unit: string; donation_type: string }) {
    return this.qrScanService.reconcileDonation(body);
  }
}
