/**
 * CampusCare splash motion — values from the Figma prototype.
 *
 * After-delays are idle holds before a transition starts.
 * Transition durations are the Smart Animate lengths themselves.
 */

/** Gradient-only hold before the logo appears. */
export const SPLASH_GRADIENT_AFTER_DELAY_MS = 1_000;

/** Gradient → branded: Smart Animate, Linear. */
export const SPLASH_BRAND_TRANSITION_MS = 300;

/** Branded hold before leaving for onboarding / home. */
export const SPLASH_BRANDED_AFTER_DELAY_MS = 1_000;

/**
 * Branded → onboarding: Smart Animate, Slow, 1250.123 ms.
 * Figma “Slow” is a spring preset (longer settle, minimal overshoot), not a
 * cubic-bezier. We approximate it with a duration-based critically-damped spring.
 */
export const SPLASH_EXIT_TRANSITION_MS = 1_250.123;

/**
 * Design reference frame from Figma (logical points).
 * Logo lockup position is proportional to this frame — not safe-area shifted.
 */
export const SPLASH_DESIGN = {
  width: 375,
  height: 812,
  /** Combined white lockup (symbol + wordmark) — `assets/Logo.png`. */
  logo: {
    /** Approximate top of artwork in the 375×812 frame. */
    top: 357,
    /** Display width matching the wordmark span (~181) while keeping aspect. */
    width: 181,
  },
  gradient: {
    colors: ['#004EEB', '#004EEB', '#84ADFF'] as const,
    locations: [0, 0.3, 1] as const,
  },
} as const;
