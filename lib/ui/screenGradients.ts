/**
 * Shared screen shell gradients (home, health service, SDA, etc.).
 * `colors[0]` sits on `start` (y:1); last color on `end` (y:0) for vertical top → bottom fade.
 */
export const HOME_BG_GRADIENT_COLORS = ['#E8EFFF', '#F4F8FF', '#FFFFFF'] as const;

export const HOME_BG_GRADIENT_LOCATIONS = [0, 0.55, 1] as const;

export const HOME_SCROLL_PADDING_H = 20;
