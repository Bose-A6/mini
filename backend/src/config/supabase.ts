import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SUPABASE_URL = 'https://bumvcmvvfjmngskwphoi.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXZjbXZ2Zmptbmdza3dwaG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MTM5MTIsImV4cCI6MjEwNTM4OTkxMn0.kj1BNlDs0bfjUMxKrFls50n0J-zc_k9QSUcObW1cEo8';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXZjbXZ2Zmptbmdza3dwaG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgxMzkxMiwiZXhwIjoyMTA1Mzg5OTEyfQ.UBqxnThCUqtzpwJUvTYH07ljbNm6ELCakeJUBtcQbc0';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

export function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Supabase credentials missing.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
