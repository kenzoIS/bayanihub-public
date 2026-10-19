import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { DonorsModule } from './donors/donors.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { DocumentsModule } from './documents/documents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QrModule } from './qr/qr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    ApplicationsModule,
    DonorsModule,
    VolunteersModule,
    CampaignsModule,
    DocumentsModule,
    DashboardModule,
    QrModule,
  ],
})
export class AppModule {}
