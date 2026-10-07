import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';

/** Server-rejected or missing refresh tokens — local session must be cleared. */
export function isStaleSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const authError = error as AuthError;
  const message = (authError.message ?? '').toLowerCase();

  if (authError.status === 401 || authError.status === 403) return true;

  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('session not found') ||
    message.includes('jwt expired') ||
    message.includes('invalid claim')
  );
}

/**
 * PostgREST PGRST303 — common after cold start / resume when a persisted access
 * token is validated against a slightly skewed API clock.
 */
export function isJwtClockSkewError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as { code?: string; message?: string };
  const message = (err.message ?? '').toLowerCase();

  return err.code === 'PGRST303' || message.includes('jwt issued at future');
}

/** Wipe persisted auth without calling the server (token may already be invalid). */
export async function clearStaleSession(client: SupabaseClient): Promise<void> {
  await client.auth.signOut({ scope: 'local' });
}

/**
 * Return a network-fresh session before the first DB calls.
 * Falls back to the cached session if refresh fails for a non-auth reason.
 */
export async function ensureFreshSession(client: SupabaseClient): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error && isStaleSessionError(error)) {
    await clearStaleSession(client);
    return null;
  }

  if (!session) return null;

  const { data, error: refreshError } = await client.auth.refreshSession();

  if (refreshError) {
    if (isStaleSessionError(refreshError)) {
      await clearStaleSession(client);
      return null;
    }
    return session;
  }

  return data.session ?? session;
}

/** Run `fn`; on PGRST303 refresh the session once and retry. */
export async function withFreshSessionRetry<T>(
  client: SupabaseClient,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isJwtClockSkewError(error)) throw error;

    const { error: refreshError } = await client.auth.refreshSession();
    if (refreshError && isStaleSessionError(refreshError)) {
      await clearStaleSession(client);
      throw refreshError;
    }

    return await fn();
  }
}
