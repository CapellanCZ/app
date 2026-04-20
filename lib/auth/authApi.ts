import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type ApiResult = { ok: boolean; message: string };

const NOT_CONFIGURED: ApiResult = {
  ok: false,
  message: 'Authentication service is not configured.',
};

/**
 * Sends a one-time password (OTP) and magic link to the given email via Supabase.
 */
export async function sendOtp(email: string): Promise<ApiResult> {
  if (!isSupabaseConfigured || !supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'OTP sent.' };
}

/**
 * Verifies the 6-digit OTP code submitted by the user.
 */
export async function verifyOtp(email: string, token: string): Promise<ApiResult> {
  if (!isSupabaseConfigured || !supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Verified.' };
}
