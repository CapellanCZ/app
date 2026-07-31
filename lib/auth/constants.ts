/** Resend cooldown for OTP login (seconds). */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Loose email shape check — enrollment is enforced by OTP + patients row. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
