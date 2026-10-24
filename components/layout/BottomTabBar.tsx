/** Visible floating pill height (excludes safe-area / float gap). */
export const ANDROID_TAB_BAR_HEIGHT = 64;
/** Space between the floating pill and the home-indicator / screen bottom. */
export const ANDROID_TAB_FLOAT_GAP = 12;

/**
 * Bottom padding for scroll content above the tab bar.
 * Floating pill + float gap (safe area is applied separately by screens).
 */
export const TAB_BAR_HEIGHT = ANDROID_TAB_BAR_HEIGHT + ANDROID_TAB_FLOAT_GAP;

/** @deprecated Prefer ANDROID_TAB_FLOAT_GAP — alias for older FAB overhang imports. */
export const ANDROID_TAB_FAB_OVERHANG = ANDROID_TAB_FLOAT_GAP;
