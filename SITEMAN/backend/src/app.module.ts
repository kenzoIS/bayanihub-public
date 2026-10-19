import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { VolunteerRolesModule } from './volunteer-roles/volunteer-roles.module';
import { MissionsModule } from './missions/missions.module';
import { AuthModule } from './auth/auth.module';
import { QrScanModule } from './qr-scan/qr-scan.module';
import { ShiftsModule } from './shifts/shifts.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    CampaignsModule,
    VolunteerRolesModule,
    MissionsModule,
    AuthModule,
    QrScanModule,
    ShiftsModule,
    TasksModule,
  ],
})
export class AppModule {}


