import { showAppToast } from '@/lib/ui/toastBridge';
import type { NotificationItem, NotificationStatusType } from '@/lib/notifications/types';

const recentToastIds = new Map<string, number>();
const TOAST_DEDUPE_MS = 12_000;

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

/** Show a top toast for a notification, deduped by notification id. */
export function toastFromNotification(
  item: Pick<NotificationItem, 'id' | 'title' | 'body' | 'notificationType'>,
): void {
  if (wasNotificationToasted(item.id)) return;
  markNotificationToasted(item.id);

  showAppToast({
    variant: toastVariant(item.notificationType),
    status: item.notificationType ?? 'info',
    placement: 'top',
    duration: 5000,
    label: item.title,
    description: item.body,
  });
}
