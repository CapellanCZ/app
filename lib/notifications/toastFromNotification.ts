import { AppState, Platform } from 'react-native';

import { isNotificationsAvailable } from '@/lib/notifications/isNotificationsAvailable';
import type { NotificationItem, NotificationStatusType } from '@/lib/notifications/types';
import { showAppToast } from '@/lib/ui/toastBridge';

const recentToastIds = new Map<string, number>();
const TOAST_DEDUPE_MS = 12_000;

let androidChannelReady = false;

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

async function ensureAndroidChannel(
  Notifications: typeof import('expo-notifications'),
) {
  if (Platform.OS !== 'android' || androidChannelReady) return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'CampusCare',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2970FF',
    sound: 'default',
  });
  androidChannelReady = true;
}

/**
 * Also raise a local OS notification so the user sees the alert
 * even when the in-app toast binder misses, or the app is backgrounded
 * before Expo push arrives.
 */
async function presentLocalOsAlert(item: {
  id: string;
  title: string;
  body: string;
  href?: string | null;
}): Promise<void> {
  if (!isNotificationsAvailable()) return;
  try {
    const Notifications = await import('expo-notifications');
    await ensureAndroidChannel(Notifications);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: item.body,
        sound: true,
        data: {
          href: item.href ?? '/appointments',
          notificationId: item.id,
        },
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[toast] local OS alert failed:', e);
  }
}

function isQueueMilestoneTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("it's your turn") ||
    t.includes('its your turn') ||
    t.includes("you're next") ||
    t.includes('youre next') ||
    t.includes('5th in queue') ||
    t.includes('3rd in queue')
  );
}

/** Show a top toast for a notification, deduped by notification id. */
export function toastFromNotification(
  item: Pick<NotificationItem, 'id' | 'title' | 'body' | 'notificationType'> & {
    href?: string | null;
  },
  opts?: { alsoLocalOsAlert?: boolean },
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

  const wantLocal =
    opts?.alsoLocalOsAlert ?? isQueueMilestoneTitle(item.title);
  // Foreground only — background/killed relies on Expo push from send-push.
  if (wantLocal && AppState.currentState === 'active') {
    void presentLocalOsAlert({
      id: item.id,
      title: item.title,
      body: item.body,
      href: item.href,
    });
  }
}
