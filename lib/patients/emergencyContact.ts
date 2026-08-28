import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export function emergencyContactFromPatient(patient: {
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}): EmergencyContact {
  return {
    name: patient.emergency_contact_name?.trim() ?? '',
    phone: patient.emergency_contact_phone?.trim() ?? '',
    relationship: patient.emergency_contact_relationship?.trim() ?? '',
  };
}

/** Persist emergency contact on the linked `patients` row for the current user. */
export async function updatePatientEmergencyContact(
  contact: EmergencyContact,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.rpc('set_my_emergency_contact', {
    p_name: contact.name.trim(),
    p_phone: contact.phone.trim(),
    p_relationship: contact.relationship.trim(),
  });

  if (error) {
    console.error('[patients] set_my_emergency_contact:', error.message);
    return false;
  }

  return true;
}
