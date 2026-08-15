import { Platform } from 'react-native';

/** Visible white bar height on Android (excludes safe-area inset). */
export const ANDROID_TAB_BAR_HEIGHT = 64;
/** How far the center FAB sticks above the Android bar top. */
export const ANDROID_TAB_FAB_OVERHANG = 28;

/**
 * Bottom padding for scroll content above the tab bar.
 * iOS: NativeTabs liquid-glass bar.
 * Android: custom floating dock (bar + FAB overhang).
 */
export const TAB_BAR_HEIGHT =
  Platform.OS === 'android'
    ? ANDROID_TAB_BAR_HEIGHT + ANDROID_TAB_FAB_OVERHANG
    : 88;
