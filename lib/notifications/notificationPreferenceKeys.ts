import type { NotificationItem, NotificationRow } from './types';

export const NOTIFICATION_PREFERENCE_KEYS = ['appointments', 'announcements', 'health'] as const;

export type NotificationPreferenceKey = (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  appointments: true,
  announcements: true,
  health: true,
};

type PreferenceSource = Pick<NotificationRow, 'type' | 'metadata' | 'category'>;

/** Maps a DB notification row to the profile settings toggle key. */
export function resolveNotificationPreferenceKey(source: PreferenceSource): NotificationPreferenceKey {
  const type = (source.type ?? '').toLowerCase();
  const meta = source.metadata ?? {};
  const milestone =
    typeof meta.queue_milestone === 'string' ? meta.queue_milestone.toLowerCase() : null;

  if (type === 'announcement') return 'announcements';

  const category =
    (typeof meta.category === 'string' ? meta.category : source.category ?? '').toLowerCase();
  if (category === 'campus') return 'announcements';

  if (type === 'queue' || (milestone && milestone !== 'visit_completed')) return 'health';
  if (type === 'appointment' || type === 'consultation_request') return 'appointments';

  return 'health';
}

/** Fallback when only the UI item shape is available. */
export function resolveNotificationPreferenceKeyFromItem(item: NotificationItem): NotificationPreferenceKey {
  if (item.category === 'campus') return 'announcements';

  const title = item.title.toLowerCase();
  const href = item.href.toLowerCase();
  if (
    href.includes('/queue') ||
    title.includes('queue') ||
    title.includes('your turn') ||
    title.includes("you're next") ||
    title.includes('youre next')
  ) {
    return 'health';
  }

  if (
    href.includes('/appointment') ||
    href.includes('visit-completed') ||
    title.includes('appointment') ||
    title.includes('visit completed') ||
    title.includes('reminder')
  ) {
    return 'appointments';
  }

  return 'health';
}

export function isNotificationAllowed(
  preferences: NotificationPreferences,
  source: PreferenceSource | NotificationItem,
): boolean {
  const key =
    'id' in source
      ? resolveNotificationPreferenceKeyFromItem(source)
      : resolveNotificationPreferenceKey(source);
  return preferences[key];
}
