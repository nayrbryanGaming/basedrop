import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';

// Server-side API routes use SERVICE_ROLE_KEY to bypass RLS safely.
// This key is never sent to the browser - it only exists in server env.
// Falls back to ANON_KEY if SERVICE_ROLE_KEY is not set (requires correct RLS policies).
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
