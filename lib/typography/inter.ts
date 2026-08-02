/**
 * Inter faces loaded in `app/_layout.tsx` via `@tamagui/font-inter` OTFs.
 * Use these family names on RN `Text` — do not rely on fontWeight alone.
 */
export const Inter = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export type InterFamily = (typeof Inter)[keyof typeof Inter];
