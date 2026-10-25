/**
 * Allowlist in-app paths from push/local notification `data.href`.
 * Rejects absolute URLs, schemes, and unknown routes (open-redirect / phishing).
 */

const ALLOWED_PREFIXES = [
  '/notifications',
  '/my-queue',
  '/vital-signs',
  '/visit-completed',
  '/announcement/',
  '/health-service',
  '/(tabs)',
  '/(settings)',
  '/appointments',
] as const;

export function sanitizeNotificationHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;

  // Absolute / external / protocol-relative
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) {
    return null;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  // Block path traversal and query-only tricks
  if (path.includes('..') || path.includes('\\')) {
    return null;
  }

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
  );
  return allowed ? path : null;
}
