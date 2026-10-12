import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { isValidEmail } from './constants';
import { friendlyAuthError } from './friendlyAuthError';

type ApiResult = { ok: boolean; message: string };

const NOT_CONFIGURED: ApiResult = {
  ok: false,
  message: 'Sign-in is temporarily unavailable. Please try again in a moment.',
};

/** Shown when email is not on the clinic-imported roster. */
export const NOT_ENROLLED_MESSAGE =
  'This school email is not enrolled yet. Ask the campus clinic to import your record, then try again.';

const NOT_ENROLLED: ApiResult = {
  ok: false,
  message: NOT_ENROLLED_MESSAGE,
};

function isAuthUserMissingError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('user not allowed') ||
    msg.includes('signups not allowed') ||
    msg.includes('user not found') ||
    (msg.includes('signup') && msg.includes('disabled'))
  );
}

/**
 * True when the email exists on `patients` or `patient_records` (web import roster).
 */
async function isEmailOnPatientRoster(email: string): Promise<boolean | null> {
  if (!supabase) return null;

  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.rpc('email_on_patient_roster', {
    normalized_email: normalized,
  });

  if (error) {
    if (__DEV__) {
      console.warn('[auth] email_on_patient_roster failed:', error.message);
    }
    return null;
  }

  return Boolean(data);
}

/**
 * Sends a 6-digit email OTP only for clinic-imported emails.
 * Gates on the patient roster before Auth OTP (avoids OTP UI when not enrolled).
 */
export async function sendOtp(email: string): Promise<ApiResult> {
  if (!isSupabaseConfigured || !supabase) {
    if (__DEV__) {
      console.warn(
        '[auth] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing from this JS bundle. Restart Metro with cache clear and reconnect the app to this bundler.',
      );
    }
    return NOT_CONFIGURED;
  }

  const normalized = email.trim().toLowerCase();

  if (!isValidEmail(normalized)) {
    return {
      ok: false,
      message:
        'Use your NU Dasma email (@students.nu-dasma.edu.ph or @nu-dasma.edu.ph).',
    };
  }

  const onRoster = await isEmailOnPatientRoster(normalized);
  if (onRoster === false) {
    return NOT_ENROLLED;
  }
  if (onRoster === null) {
    return {
      ok: false,
      message: 'We could not verify your enrollment right now. Please try again in a moment.',
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error && isAuthUserMissingError(error.message)) {
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
    email: email.trim().toLowerCase(),
    token,
    type: 'email',
  });

  if (error) {
    if (isAuthUserMissingError(error.message)) return NOT_ENROLLED;
    return { ok: false, message: friendlyAuthError(error.message) };
  }
  return { ok: true, message: 'Verified.' };
}
