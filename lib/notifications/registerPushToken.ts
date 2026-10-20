import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { ensureDefaultAndroidNotificationChannel } from '@/lib/notifications/androidNotificationChannel';
import { isNotificationsAvailable } from '@/lib/notifications/isNotificationsAvailable';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function resolvePlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

/**
 * Request permission + register the device's Expo push token with Supabase.
 * Safe to call multiple times — upserts on (user_id, device_id).
 *
 * Ensures the Android `default` channel exists before token registration so
 * closed-app / FCM deliveries can appear in the system tray.
 * Skipped on simulators and Android Expo Go (remote push removed in SDK 53+).
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (!userId?.trim()) return;
  if (!isSupabaseConfigured || !supabase) return;
  if (!Device.isDevice) return;
  if (!isNotificationsAvailable()) return;

  try {
    // Channel must exist before the first push arrives (Android 8+).
    await ensureDefaultAndroidNotificationChannel();

    const Notifications = await import('expo-notifications');

    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      status = req.status;
    }
    if (status !== 'granted') {
      console.warn('[push] Notification permission not granted — closed-app push disabled');
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] Missing EAS projectId — cannot get Expo push token');
      return;
    }

    let expo_token: string;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      expo_token = tokenData.data;
    } catch (tokenErr) {
      const message = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
      // Stale / unregistered native push registration — clear local attempt; server cleans DeviceNotRegistered.
      if (/DeviceNotRegistered|not.?registered|INVALID_TOKEN/i.test(message)) {
        console.warn('[push] Device push token invalid/stale:', message);
      } else {
        console.warn('[push] getExpoPushTokenAsync failed:', message);
      }
      return;
    }

    if (!expo_token?.startsWith('ExponentPushToken')) {
      console.warn('[push] Unexpected token format — skipping upsert');
      return;
    }

    const device_id = Device.osInternalBuildId ?? Device.modelId ?? 'unknown';
    const platform = resolvePlatform();

    const { error } = await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        device_id,
        expo_token,
        platform,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_id' },
    );

    if (error) {
      console.warn('[push] Failed to save token:', error.message);
    } else {
      console.log('[push] Token registered successfully:', expo_token.slice(0, 24) + '...');
    }
  } catch (err) {
    console.warn('[push] registerPushToken failed:', err);
  }
}
