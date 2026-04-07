import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-reanimated';
import { createInterFont } from '@tamagui/font-inter';
import { createTamagui } from 'tamagui';

/** Matches `useFonts` names in `app/_layout.tsx` — maps CSS weights to loaded OTF families on native. */
const interFace = {
  100: { normal: 'Inter' },
  200: { normal: 'Inter' },
  300: { normal: 'Inter' },
  400: { normal: 'Inter' },
  500: { normal: 'Inter' },
  600: { normal: 'InterBold' },
  700: { normal: 'InterBold' },
  800: { normal: 'InterBold' },
  900: { normal: 'InterBold' },
} as const;

const bodyFont = createInterFont(
  {
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
