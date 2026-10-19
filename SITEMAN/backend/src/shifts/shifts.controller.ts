import { Controller, Get, Param, Post } from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('pending')
  getPendingShifts() {
    return this.shiftsService.getPendingShifts();
  }

  @Post(':id/approve')
  approveShift(@Param('id') id: string) {
    return this.shiftsService.approveShift(id);
  }

  @Post(':id/deny')
  denyShift(@Param('id') id: string) {
    return this.shiftsService.denyShift(id);
  }
}
