import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { SupabaseModule } from './supabase/supabase.module';
import { DeploymentModule } from './deployment/deployment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    FormsModule,
    DeploymentModule,
  ],
})
export class AppModule {}