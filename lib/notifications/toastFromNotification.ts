import { AppState } from 'react-native';

import type { NotificationItem, NotificationStatusType } from '@/lib/notifications/types';
import { showAppToast } from '@/lib/ui/toastBridge';

const recentToastIds = new Map<string, number>();
const TOAST_DEDUPE_MS = 20_000;

function prune(now: number) {
  for (const [id, at] of recentToastIds) {
    if (now - at > TOAST_DEDUPE_MS) recentToastIds.delete(id);
  }
}

/** Mark a notification id so realtime INSERT does not toast it again. */
export function markNotificationToasted(id: string): void {
  const now = Date.now();
  prune(now);
  recentToastIds.set(id, now);
}

export function wasNotificationToasted(id: string): boolean {
  const now = Date.now();
  prune(now);
  const at = recentToastIds.get(id);
  return at != null && now - at < TOAST_DEDUPE_MS;
}

function toastVariant(
  status: NotificationStatusType | undefined,
): 'success' | 'danger' | 'warning' | 'accent' {
  if (status === 'success') return 'success';
  if (status === 'error') return 'danger';
  if (status === 'warning') return 'warning';
  return 'accent';
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
}

/** Extra keys so DB UUID + push receipt + client paths collapse to one toast. */
function dedupeKeys(
  item: Pick<NotificationItem, 'id' | 'title' | 'body' | 'notificationType'> & {
    href?: string | null;
    ticketId?: string | null;
    queueMilestone?: string | null;
    appointmentId?: string | null;
  },
): string[] {
  const keys = [item.id];
  const title = normalizeTitle(item.title);
  const ticket = item.ticketId?.trim();
  const milestone = item.queueMilestone?.trim().toLowerCase();
  const appointmentId = item.appointmentId?.trim();

  if (ticket && milestone) {
    // Include body so nurse vs specialty "It's Your Turn" (different station text)
    // and recalls are not collapsed into one toast key.
    keys.push(`queue:${ticket}:${milestone}:${item.body ?? ''}`);
  }

  if (appointmentId && (milestone === 'visit_completed' || title.includes('visit completed'))) {
    keys.push(`visit-completed:${appointmentId}`);
  }

  if (appointmentId && (title.includes('appointment cancelled') || title.includes('appointment confirmed'))) {
    keys.push(`appt-event:${title}:${appointmentId}`);
  }

  if (
    title.includes("it's your turn") ||
    title.includes('its your turn') ||
    title.includes("you're next") ||
    title.includes('youre next') ||
    title.includes('in queue')
  ) {
    keys.push(`queue-title:${title}:${item.href ?? ''}:${item.body ?? ''}`);
  }

  return keys;
}

/**
 * In-app toast only while the app is foreground.
 * Background / killed delivery is handled by Expo push (`send-push`).
 */
export function toastFromNotification(
  item: Pick<NotificationItem, 'id' | 'title' | 'body' | 'notificationType'> & {
    href?: string | null;
    ticketId?: string | null;
    queueMilestone?: string | null;
    appointmentId?: string | null;
  },
): void {
  const keys = dedupeKeys(item);
  if (keys.some((k) => wasNotificationToasted(k))) return;
  for (const k of keys) markNotificationToasted(k);

  if (AppState.currentState !== 'active') return;

  showAppToast({
    variant: toastVariant(item.notificationType),
    status: item.notificationType ?? 'info',
    placement: 'top',
    duration: 5000,
    label: item.title,
    description: item.body,
  });
}
