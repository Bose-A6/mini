import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);

if (!hasSupabaseConfig) {
  console.warn('Supabase is not configured. Add backend/.env from backend/.env.example to enable authentication and database routes.');
}

const configuredUrl = supabaseUrl ?? 'https://placeholder.supabase.co';
const configuredAnonKey = supabaseAnonKey ?? 'missing-anon-key';
const configuredServiceRoleKey = supabaseServiceRoleKey ?? 'missing-service-role-key';

export function requireSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase is not configured. Create backend/.env from backend/.env.example and add your project credentials.');
  }
}

export const supabase = createClient(configuredUrl, configuredAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin = createClient(configuredUrl, configuredServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
