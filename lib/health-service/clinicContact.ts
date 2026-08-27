import { Linking } from 'react-native';

/**
 * Placeholder clinic line until staff phone numbers are wired from Supabase.
 * Format: E.164 (Philippines mobile sample).
 */
export const SAMPLE_CLINIC_PHONE = '+639171234567';

/** Open the device dialer for a clinic / staff number (falls back to sample). */
export function openClinicCall(phoneNumber?: string | null): void {
  const raw = (phoneNumber?.trim() || SAMPLE_CLINIC_PHONE).replace(/[^\d+]/g, '');
  if (!raw) return;
  void Linking.openURL(`tel:${raw}`);
}
