import type { Staff } from './types';

/** Default provider when opening Book (+) — physician first, then dentist. */
export function getDefaultBookingStaff(staff: Staff[]): Staff | undefined {
  return (
    staff.find((s) => s.role === 'doctor') ??
    staff.find((s) => s.role === 'dentist') ??
    staff[0]
  );
}
