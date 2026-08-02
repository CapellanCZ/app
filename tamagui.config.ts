import { isWeb } from '@tamagui/core';
import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-reanimated';
import { createInterFont } from '@tamagui/font-inter';
import { createTamagui } from 'tamagui';

/**
 * Inter faces — keys must match `useFonts` in `app/_layout.tsx`.
 * Separate OTF files per weight (RN cannot synthesize Inter weights from one family).
 */
const interFace = {
  100: { normal: 'Inter-Regular' },
  200: { normal: 'Inter-Regular' },
  300: { normal: 'Inter-Regular' },
  400: { normal: 'Inter-Regular' },
  500: { normal: 'Inter-Medium' },
  600: { normal: 'Inter-SemiBold' },
  700: { normal: 'Inter-Bold' },
  800: { normal: 'Inter-Bold' },
  900: { normal: 'Inter-Bold' },
} as const;

const interFamilyStack = isWeb
  ? `Inter, Inter-Regular, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
  : 'Inter-Regular';

const bodyFont = createInterFont(
  {
    family: interFamilyStack,
    face: interFace,
    weight: {
      1: '400',
    },
  },
  {
    sizeSize: (size) => Math.round(size),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size >= 12 ? 8 : 4)),
  },
);

const headingFont = createInterFont(
  {
    family: interFamilyStack,
    face: interFace,
    weight: {
      0: '600',
      6: '700',
      9: '800',
    },
  },
  {
    sizeSize: (size) => Math.round(size),
    sizeLineHeight: (size) => Math.round(size * 1.2),
  },
);

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  animations,
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation
  interface TamaguiCustomConfig extends Conf {}
}
