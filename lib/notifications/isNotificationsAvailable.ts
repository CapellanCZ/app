import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * Android remote push was removed from Expo Go in SDK 53+.
 * Importing `expo-notifications` there triggers a console.error via
 * DevicePushTokenAutoRegistration — skip the package entirely.
 */
export function isAndroidExpoGo(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

/** Whether it is safe to load / call `expo-notifications`. */
export function isNotificationsAvailable(): boolean {
  return !isAndroidExpoGo();
}
