import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client (uses the anon/public key).
 * Used for auth sign-in/sign-out and public read operations.
 * Sensitive admin operations are handled in the NestJS backend using the service-role key.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
