import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { Patient } from './types';

const PATIENT_SELECT =
  'id, auth_user_id, full_name, email, patient_type, student_id, employee_id, affiliation, phone, avatar_url';

/**
 * Loads the enrolled campus patient linked to the auth user.
 * Returns null when no `patients` row exists for this uid.
 */
export async function fetchPatientByAuthUserId(authUserId: string): Promise<Patient | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_SELECT)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    console.error('[patients] fetchPatientByAuthUserId:', error.message);
    return null;
  }

  return (data as Patient | null) ?? null;
}
