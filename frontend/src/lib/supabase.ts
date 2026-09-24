import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bumvcmvvfjmngskwphoi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXZjbXZ2Zmptbmdza3dwaG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MTM5MTIsImV4cCI6MjEwNTM4OTkxMn0.kj1BNlDs0bfjUMxKrFls50n0J-zc_k9QSUcObW1cEo8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
