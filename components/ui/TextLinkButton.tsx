import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, Text } from 'react-native';

import { androidPressProps } from '@/lib/ui/androidPress';

export type TextLinkButtonProps = {
  /** Visible label. */
  label: string;
  /** Expo Router destination (e.g. `"/appointments"`). */
  href: Href;
  /** Screen reader label; defaults to `label`. */
  accessibilityLabel?: string;
  /** Tailwind classes for the text (NativeWind / Uniwind). */
  className?: string;
  /** Touch target expansion in dp; default 12. */
  hitSlop?: number;
};

/**
 * Tappable text that navigates with `router.push`. Use for "See all"-style links.
 */
export function TextLinkButton({
  label,
  href,
  accessibilityLabel,
  className = 'text-sm font-normal text-[#006FFD]',
  hitSlop = 12,
}: TextLinkButtonProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(href);
  }, [router, href]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={handlePress}
      {...androidPressProps({ borderless: true, hitSlop })}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        opacity: pressed ? 0.55 : 1,
      })}>
      <Text className={className}>{label}</Text>
    </Pressable>
  );
}
