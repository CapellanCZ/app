import { Platform } from 'react-native';

/** Shared text-field focus tokens (home brand blue). */
export const INPUT_BRAND = '#2970FF';
export const INPUT_BRAND_RING = 'rgba(41, 112, 255, 0.12)';
export const INPUT_ERROR = '#EF4444';
export const INPUT_ERROR_RING = 'rgba(239, 68, 68, 0.12)';
export const INPUT_FIELD_BG = '#F9F9F9';
export const INPUT_PLACEHOLDER = '#A7A7A7';
export const INPUT_TEXT = '#111111';

/** Soft chip field + brand focus ring (matches AppInput). */
export const inputFieldBase = {
  backgroundColor: INPUT_FIELD_BG,
  borderRadius: 16,
  borderWidth: 0,
  borderColor: 'transparent' as const,
};

/** Focus/error glow — iOS only; Android elevation/boxShadow looks muddy. */
const focusRing =
  Platform.OS === 'android'
    ? null
    : { boxShadow: `0 0 0 3px ${INPUT_BRAND_RING}` };

const errorRing =
  Platform.OS === 'android'
    ? null
    : { boxShadow: `0 0 0 3px ${INPUT_ERROR_RING}` };

export const inputFieldFocused = {
  borderWidth: 1.5,
  borderColor: INPUT_BRAND,
  ...focusRing,
};

export const inputFieldError = {
  borderWidth: 1.5,
  borderColor: INPUT_ERROR,
  ...errorRing,
};
