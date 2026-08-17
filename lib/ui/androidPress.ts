import { Platform, type PressableProps } from 'react-native';

/** Material / a11y minimum touch target on Android. */
export const ANDROID_MIN_TOUCH = 48;

/** Soft brand ripple used across patient CTAs. */
export const ANDROID_RIPPLE_BRAND = {
  color: 'rgba(0, 0, 0, 0.12)',
  borderless: false,
  foreground: true,
} as const;

export const ANDROID_RIPPLE_LIGHT = {
  color: 'rgba(255, 255, 255, 0.22)',
  borderless: false,
  foreground: true,
} as const;

export const ANDROID_RIPPLE_BORDERLESS = {
  color: 'rgba(0, 0, 0, 0.12)',
  borderless: true,
} as const;

/**
 * Default Pressable props that make taps feel reliable on Android
 * (ripple + slightly larger hit area without changing layout).
 */
export function androidPressProps(opts?: {
  borderless?: boolean;
  light?: boolean;
  hitSlop?: number;
}): Pick<PressableProps, 'android_ripple' | 'hitSlop'> {
  if (Platform.OS !== 'android') {
    return opts?.hitSlop != null ? { hitSlop: opts.hitSlop } : {};
  }

  const ripple = opts?.borderless
    ? ANDROID_RIPPLE_BORDERLESS
    : opts?.light
      ? ANDROID_RIPPLE_LIGHT
      : ANDROID_RIPPLE_BRAND;

  return {
    android_ripple: ripple,
    hitSlop: opts?.hitSlop ?? 6,
  };
}
