import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createAuthStorage } from '@/lib/auth/secureAuthStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

/** Set `EXPO_PUBLIC_SUPABASE_*` when you add a backend; until then the app runs without Supabase. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Node/SSR (Expo Router web) has no `window` — avoid native storage there. */
const isBrowserLike = typeof window !== 'undefined';

const authStorage = createAuthStorage();

if (__DEV__) {
  console.log(
    '[Supabase] configured:',
    isSupabaseConfigured,
    '| URL:',
    supabaseUrl ? `${supabaseUrl.slice(0, 30)}…` : '(empty)',
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: isBrowserLike,
        persistSession: isBrowserLike,
        detectSessionInUrl: false,
      },
    })
  : null;
