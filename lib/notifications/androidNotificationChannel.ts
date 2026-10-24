import { Platform } from 'react-native';

import { isNotificationsAvailable } from '@/lib/notifications/isNotificationsAvailable';

/** Must match `channelId` sent by `send-push` Edge Function. */
export const ANDROID_DEFAULT_CHANNEL_ID = 'default';

/**
 * Create the Android notification channel used for Expo Push (FCM).
 * Safe to call repeatedly. No-op on iOS / Android Expo Go.
 */
export async function ensureDefaultAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!isNotificationsAvailable()) return;

  try {
    const Notifications = await import('expo-notifications');

    await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID, {
      name: 'CampusCare',
      description: 'Appointment, queue, and campus notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#004EEB',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      enableVibrate: true,
      showBadge: true,
      sound: 'default',
    });
  } catch (err) {
    console.warn('[push] Failed to create Android notification channel:', err);
  }
}
