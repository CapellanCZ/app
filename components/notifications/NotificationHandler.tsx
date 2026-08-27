import { isNotificationsAvailable } from '@/lib/notifications/isNotificationsAvailable';

/**
 * Sets up push notification listeners when supported.
 * No-op on Android Expo Go (SDK 53+ removed remote push there).
 */
export function NotificationHandler() {
  if (!isNotificationsAvailable()) {
    return null;
  }

  // Require only when available so Android Expo Go never loads expo-notifications.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NotificationHandlerActive } =
    require('./NotificationHandlerActive') as typeof import('./NotificationHandlerActive');

  return <NotificationHandlerActive />;
}
