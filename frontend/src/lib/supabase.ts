import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to log status in development
if (isSupabaseConfigured) {
  console.log('⚡ Connected to Supabase backend:', supabaseUrl);
} else {
  console.log('ℹ️ Operating in High-Fidelity Reactive Mode (Configure Supabase credentials in .env to connect live cloud database).');
}
