import { NotAuthenticatedError, NotAuthorizedError } from '@/lib/auth/errors';
import { supabase } from '@/lib/supabase';

const STAFF_ROLES = new Set([
  'staff',
  'admin',
  'physician',
  'doctor',
  'nurse',
  'dentist',
  'clinic_staff',
]);

/**
 * Fail closed: staff/clinical write APIs require a staff role in app_metadata
 * (not user_metadata — that field is user-editable in Supabase).
 * RLS must still enforce this server-side.
 */
export async function requireClinicStaff(): Promise<{ userId: string }> {
  if (!supabase) throw new Error('Supabase not configured');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new NotAuthenticatedError();

  const meta = user.app_metadata ?? {};
  const roleRaw = meta.role ?? meta.primary_role ?? meta.user_role;
  const role = typeof roleRaw === 'string' ? roleRaw.toLowerCase().trim() : '';

  if (!role || !STAFF_ROLES.has(role)) {
    throw new NotAuthorizedError('Not authorized for clinic staff actions');
  }

  return { userId: user.id };
}
