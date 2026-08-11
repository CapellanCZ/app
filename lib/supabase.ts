import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

/** Set `EXPO_PUBLIC_SUPABASE_*` when you add a backend; until then the app runs without Supabase. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/** Node/SSR (Expo Router web) has no `window` — AsyncStorage crashes there. */
const isBrowserLike = typeof window !== 'undefined';

const memoryStorage: AuthStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const authStorage: AuthStorage = isBrowserLike
  ? {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: (key) => AsyncStorage.removeItem(key),
    }
  : memoryStorage;

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
