import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';

@Module({
  imports: [
    // Load .env into process.env globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Decoupled modules — each can be extracted to its own microservice
    SupabaseModule,
    AuthModule,
    FormsModule,
  ],
})
export class AppModule {}
