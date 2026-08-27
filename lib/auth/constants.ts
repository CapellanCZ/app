/** Resend cooldown for OTP login (seconds). */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Campus email domains suggested while typing on login. */
export const SCHOOL_EMAIL_DOMAINS = [
  'students.nu-dasma.edu.ph',
  'nu-dasma.edu.ph',
] as const;

export type SchoolEmailDomain = (typeof SCHOOL_EMAIL_DOMAINS)[number];

/** Loose email shape check — enrollment is enforced by OTP + patients row. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Domains to show as suggestion chips for the current email draft.
 * Hidden once the typed domain already fully matches a known school domain.
 */
export function matchingSchoolEmailDomains(email: string): SchoolEmailDomain[] {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at < 0) return [];

  const local = trimmed.slice(0, at);
  if (!local) return [];

  const domainPart = trimmed.slice(at + 1);
  if (SCHOOL_EMAIL_DOMAINS.some((d) => d === domainPart)) return [];

  return SCHOOL_EMAIL_DOMAINS.filter((d) => d.startsWith(domainPart));
}

/** Apply a suggested domain onto the local-part of an email draft. */
export function applySchoolEmailDomain(email: string, domain: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  const local = (at >= 0 ? trimmed.slice(0, at) : trimmed).trim().toLowerCase();
  if (!local) return '';
  return `${local}@${domain}`;
}
