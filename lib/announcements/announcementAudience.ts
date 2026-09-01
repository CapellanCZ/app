import type { PatientType } from '@/lib/patients/types';

/** Audiences the mobile app supports (case-insensitive). */
export const MOBILE_ANNOUNCEMENT_AUDIENCES = ['all', 'student', 'faculty', 'employee'] as const;

export type MobileAnnouncementAudience = (typeof MOBILE_ANNOUNCEMENT_AUDIENCES)[number];

const AUDIENCE_TITLE_CASE: Record<MobileAnnouncementAudience, string> = {
  all: 'All',
  student: 'Student',
  faculty: 'Faculty',
  employee: 'Employee',
};

function normalizeAudience(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isMobileAnnouncementAudience(
  audience: string | null | undefined,
): audience is MobileAnnouncementAudience {
  return (MOBILE_ANNOUNCEMENT_AUDIENCES as readonly string[]).includes(normalizeAudience(audience));
}

/** DB stores Title Case (`Student`, `Faculty`, …). */
export function toDbAudience(audience: MobileAnnouncementAudience): string {
  return AUDIENCE_TITLE_CASE[audience];
}

export function normalizePatientType(
  patientType: string | null | undefined,
): PatientType | null {
  const value = normalizeAudience(patientType);
  if (value === 'student' || value === 'faculty' || value === 'employee') {
    return value;
  }
  return null;
}

/** Audiences a patient may read: their role + campus-wide `All`. */
export function dbAudiencesForPatientType(
  patientType: string | null | undefined,
): string[] {
  const type = normalizePatientType(patientType);
  if (!type) return [toDbAudience('all')];
  return [toDbAudience('all'), toDbAudience(type)];
}

export function patientMatchesAnnouncementAudience(
  patientType: string | null | undefined,
  audience: string | null | undefined,
): boolean {
  const normalizedAudience = normalizeAudience(audience);
  if (!isMobileAnnouncementAudience(normalizedAudience)) return false;
  if (normalizedAudience === 'all') return true;

  const type = normalizePatientType(patientType);
  return type !== null && normalizedAudience === type;
}

export function shouldRefreshAnnouncementsForAudience(
  audience: string | null | undefined,
): boolean {
  return isMobileAnnouncementAudience(audience);
}
