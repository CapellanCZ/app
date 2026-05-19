import { FadeInDown } from 'react-native-reanimated';

const DURATION_MS = 260;
const STAGGER_MS = 45;
const MAX_STAGGER_MS = 280;

/**
 * List item enter: fade in + slide up (timing only — no spring bounce).
 * Pass `index` for a light stagger on first paint.
 */
export function fadeSlideUpEntering(index = 0) {
  const delay = Math.min(index * STAGGER_MS, MAX_STAGGER_MS);
  return FadeInDown.delay(delay).duration(DURATION_MS);
}
