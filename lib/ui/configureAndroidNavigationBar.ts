import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Android system navigation bar — keep controls readable on CampusCare’s light UI.
 *
 * Note: the gesture-navigation “pill” size is OS-controlled and cannot be enlarged
 * by the app. We only improve contrast / button style so it does not look like a
 * faint dot against white edge-to-edge content.
 */
export function configureAndroidNavigationBar() {
  if (Platform.OS !== 'android') return;

  try {
    // Light bar → dark buttons / indicators (matches white / #F9F9F9 screens).
    NavigationBar.setStyle('light');
    NavigationBar.setHidden(false);
  } catch (e) {
    console.warn('[navigation-bar] configure failed:', e);
  }
}
