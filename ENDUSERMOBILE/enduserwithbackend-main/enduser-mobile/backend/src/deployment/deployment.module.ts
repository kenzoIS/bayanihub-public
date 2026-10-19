import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { DeploymentController } from './deployment.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [DeploymentController],
})
export class DeploymentModule {}
