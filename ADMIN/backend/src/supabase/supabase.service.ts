import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAnonKey(): string {
    return this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  getUrl(): string {
    return this.config.getOrThrow<string>('SUPABASE_URL');
  }
}
