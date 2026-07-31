import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { friendlyAuthError } from './friendlyAuthError';

type ApiResult = { ok: boolean; message: string };

const NOT_CONFIGURED: ApiResult = {
  ok: false,
  message: 'Authentication service is not configured.',
};

const NOT_ENROLLED: ApiResult = {
  ok: false,
  message: 'Not enrolled — contact clinic admin.',
};

/**
 * Sends a 6-digit email OTP. Only works for existing auth users (web-imported patients).
 * No magic link / redirect — code is entered in-app.
 */
export async function sendOtp(email: string): Promise<ApiResult> {
  if (!isSupabaseConfigured || !supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error && error.message.includes('User not allowed')) {
    return NOT_ENROLLED;
  }

  if (error) return { ok: false, message: friendlyAuthError(error.message) };

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

  if (error) return { ok: false, message: friendlyAuthError(error.message) };
  return { ok: true, message: 'Verified.' };
}
