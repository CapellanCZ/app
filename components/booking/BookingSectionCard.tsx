import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { BRAND, CARD_ELEVATION } from '@/lib/ui/theme';

export type BookingSectionTone = 'blue' | 'yellow' | 'pink' | 'mint';

const TONE: Record<BookingSectionTone, { well: string; accent: string }> = {
  blue: { well: BRAND.soft, accent: BRAND.primary },
  yellow: { well: BRAND.soft, accent: BRAND.primary },
  pink: { well: BRAND.softSurface, accent: BRAND.primary },
  mint: { well: BRAND.soft, accent: BRAND.primary },
};

type Props = ViewProps & {
  title?: string;
  /** Soft well icon — same language as home vitals / notification glyphs. */
  icon?: ReactNode;
  tone?: BookingSectionTone;
  children: React.ReactNode;
};

/**
 * White booking section card with optional tinted icon well.
 */
export function BookingSectionCard({
  title,
  icon,
  tone = 'blue',
  children,
  style,
  ...rest
}: Props) {
  const colors = TONE[tone];

  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? (
        <View style={styles.header}>
          {icon ? (
            <View style={[styles.iconWell, { backgroundColor: colors.well }]}>{icon}</View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 16,
    gap: 14,
    ...CARD_ELEVATION,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontFamily: Inter.semiBold,
    fontSize: 17,
    color: '#222222',
    letterSpacing: -0.68,
    lineHeight: 22,
  },
});
