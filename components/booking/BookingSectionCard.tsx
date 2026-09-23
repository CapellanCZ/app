import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { Inter } from '@/lib/typography/inter';

export type BookingSectionTone = 'blue' | 'yellow' | 'pink' | 'mint';

const TONE: Record<BookingSectionTone, { well: string; accent: string }> = {
  blue: { well: '#D3E9FA', accent: '#048AF3' },
  yellow: { well: '#F4EDD6', accent: '#7E6B28' },
  pink: { well: '#F4E2FC', accent: '#7C52A2' },
  mint: { well: 'rgba(101, 217, 0, 0.22)', accent: '#4FA603' },
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
    borderColor: '#E8E8E8',
    padding: 16,
    gap: 14,
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
