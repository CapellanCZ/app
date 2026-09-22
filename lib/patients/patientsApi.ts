import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { Patient } from './types';

const PATIENT_SELECT =
  'id, auth_user_id, full_name, email, patient_type, student_id, employee_id, affiliation, phone, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, avatar_url';

type PatientRecordEmergencyRow = {
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  family_background: {
    relationship?: string | null;
    guardianName?: string | null;
  } | null;
};

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/**
 * Clinic Profile stores emergency contact on `patient_records`
 * (name/phone columns + relationship in `family_background`).
 */
async function fetchEmergencyContactFromPatientRecord(patient: Patient): Promise<{
  name: string | null;
  phone: string | null;
  relationship: string | null;
} | null> {
  if (!supabase) return null;

  const studentId = patient.student_id?.trim() || null;
  const employeeId = patient.employee_id?.trim() || null;
  if (!studentId && !employeeId) return null;

  let query = supabase
    .from('patient_records')
    .select('emergency_contact_name, emergency_contact_phone, family_background')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (studentId) {
    query = query.eq('student_id', studentId);
  } else {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('[patients] patient_records emergency contact:', error.message);
    return null;
  }
  if (!data) return null;

  const row = data as PatientRecordEmergencyRow;
  const family = row.family_background;

  return {
    name: firstNonEmpty(row.emergency_contact_name, family?.guardianName),
    phone: firstNonEmpty(row.emergency_contact_phone),
    relationship: firstNonEmpty(family?.relationship),
  };
}

function mergeEmergencyContact(
  patient: Patient,
  fromRecord: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  } | null,
): Patient {
  if (!fromRecord) return patient;

  return {
    ...patient,
    emergency_contact_name: firstNonEmpty(
      fromRecord.name,
      patient.emergency_contact_name,
    ),
    emergency_contact_phone: firstNonEmpty(
      fromRecord.phone,
      patient.emergency_contact_phone,
    ),
    emergency_contact_relationship: firstNonEmpty(
      fromRecord.relationship,
      patient.emergency_contact_relationship,
    ),
  };
}

/**
 * Loads the enrolled campus patient linked to the auth user.
 * Returns null when no `patients` row exists for this uid.
 * Emergency contact is merged from clinic `patient_records` (Profile source of truth).
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

  const patient = (data as Patient | null) ?? null;
  if (!patient) return null;

  const fromRecord = await fetchEmergencyContactFromPatientRecord(patient);
  return mergeEmergencyContact(patient, fromRecord);
}
