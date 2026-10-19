import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SupabaseService,
    {
      provide: SUPABASE_CLIENT,
      useFactory: (svc: SupabaseService): SupabaseClient => svc.getClient(),
      inject: [SupabaseService],
    },
  ],
  exports: [SupabaseService, SUPABASE_CLIENT],
})
export class SupabaseModule {}
