import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DonorsService } from './donors.service';
import { FilterDonorsDto, CreateDonationDto, UpdateDonationDto } from './dto/donors.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  /**
   * GET /donors
   * View Donor Applicant List with optional filters.
   */
  @Get()
  findAll(@Query() filters: FilterDonorsDto) {
    return this.donorsService.findAll(filters);
  }

  /**
   * GET /donors/stats
   * Dashboard statistics for donations.
   */
  @Get('stats')
  getStats() {
    return this.donorsService.getStats();
  }

  /**
   * GET /donors/:id
   * Get a single donation record.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(id);
  }

  /**
   * POST /donors
   * Create a new donation record.
   */
  @Post()
  create(@Body() dto: CreateDonationDto) {
    return this.donorsService.create(dto);
  }

  /**
   * PATCH /donors/:id
   * Update an existing donation record.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDonationDto) {
    return this.donorsService.update(id, dto);
  }

  /**
   * DELETE /donors/:id
   * Delete a donation record.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.donorsService.remove(id);
  }
}
