import type { NotificationStatusType } from './types';

/** Figma status tokens — 2254:1004 / 1022 / 1038 / 2260:1173. */
export const NOTIFICATION_STATUS_STYLE: Record<
  NotificationStatusType,
  { well: string; accent: string; unreadDot: string }
> = {
  info: { well: '#D3E9FA', accent: '#048AF3', unreadDot: '#048AF3' },
  success: { well: 'rgba(101, 217, 0, 0.4)', accent: '#4FA603', unreadDot: '#4FA603' },
  warning: { well: '#F4EDD6', accent: '#7E6B28', unreadDot: '#7C52A2' },
  error: { well: '#F4E2FC', accent: '#7C52A2', unreadDot: '#7C52A2' },
};

const STATUS_BY_TITLE: Record<string, NotificationStatusType> = {
  'appointment pending': 'info',
  'appointment confirmed': 'success',
  'appointment confirmed!': 'success',
  "you're all set": 'success',
  'youre all set': 'success',
  'visit in 30 minutes': 'warning',
  "it's your turn": 'info',
  'its your turn': 'info',
  "you're next": 'warning',
  'youre next': 'warning',
  '5th in queue': 'info',
  '3rd in queue': 'warning',
  'visit completed': 'success',
  'appointment cancelled': 'error',
  'please pick a new time': 'warning',
  'clinic on break': 'info',
  'medical certificate ready': 'success',
  'we missed you': 'warning',
  'clinic advisory': 'info',
};

/** Ordered keyword rules — first match wins (most specific first). */
const TITLE_KEYWORD_RULES: readonly { test: RegExp; status: NotificationStatusType }[] = [
  { test: /\bcancel/, status: 'error' },
  { test: /\b(missed|unavailable|pick a new|reschedul|30 minute|starts soon|3rd in queue|you.?re next)\b/, status: 'warning' },
  { test: /\b(confirm|all set|completed|certificate ready|ready)\b/, status: 'success' },
  { test: /\b(pending|your turn|5th in queue|on break|advisory|submitted|queue)\b/, status: 'info' },
];

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseExplicitStatus(
  type?: NotificationStatusType | string | null,
): NotificationStatusType | null {
  const value = (type ?? '').toLowerCase().trim();
  if (value === 'info' || value === 'success' || value === 'warning' || value === 'error') {
    return value;
  }
  return null;
}

function inferStatusFromTitle(title?: string | null): NotificationStatusType | null {
  if (!title?.trim()) return null;
  const key = normalizeTitle(title);

  const exact = STATUS_BY_TITLE[key];
  if (exact) return exact;

  for (const rule of TITLE_KEYWORD_RULES) {
    if (rule.test.test(key)) return rule.status;
  }
  return null;
}

/**
 * Resolve card status from explicit `notificationType` and/or title copy.
 * Explicit type wins; title inference covers DB rows without metadata.
 */
export function resolveNotificationStatus(
  type?: NotificationStatusType | string | null,
  title?: string | null,
): NotificationStatusType {
  return parseExplicitStatus(type) ?? inferStatusFromTitle(title) ?? 'info';
}
