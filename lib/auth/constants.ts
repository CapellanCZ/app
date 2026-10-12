/** Resend cooldown for OTP login (seconds). */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Campus email domains suggested while typing on login. */
export const SCHOOL_EMAIL_DOMAINS = [
  'students.nu-dasma.edu.ph',
  'nu-dasma.edu.ph',
] as const;

export type SchoolEmailDomain = (typeof SCHOOL_EMAIL_DOMAINS)[number];

/** True when the address uses an allowed NU Dasma campus domain. */
export function isSchoolEmailDomain(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) return false;
  const domain = trimmed.slice(at + 1);
  return (SCHOOL_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Campus email only — `@students.nu-dasma.edu.ph` or `@nu-dasma.edu.ph`.
 * Enrollment is still enforced by roster check before OTP.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  return isSchoolEmailDomain(trimmed);
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
