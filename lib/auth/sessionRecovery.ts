import type { AuthError, SupabaseClient } from '@supabase/supabase-js';

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

/** Wipe persisted auth without calling the server (token may already be invalid). */
export async function clearStaleSession(client: SupabaseClient): Promise<void> {
  await client.auth.signOut({ scope: 'local' });
}
