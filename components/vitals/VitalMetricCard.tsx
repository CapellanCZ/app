import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';

type Props = {
  label: string;
  value: string;
  status: string;
  statusColor: string;
  backgroundColor: string;
  icon: ReactNode;
  /** Taller card for the vital signs detail screen. */
  variant?: 'home' | 'detail';
};

export function VitalMetricCard({
  label,
  value,
  status,
  statusColor,
  backgroundColor,
  icon,
  variant = 'home',
}: Props) {
  const isDetail = variant === 'detail';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: isDetail ? 20 : 18,
        gap: isDetail ? 28 : 24,
        minHeight: isDetail ? 136 : 120,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text
          style={{
            flex: 1,
            fontFamily: Inter.regular,
            fontSize: isDetail ? 15 : 14,
            color: '#373636',
            letterSpacing: -0.48,
          }}>
          {label}
        </Text>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: isDetail ? 30 : 26,
            color: '#111111',
            lineHeight: isDetail ? 36 : 32,
          }}>
          {value}
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: statusColor,
            letterSpacing: -0.4,
          }}>
          {status}
        </Text>
      </View>
    </View>
  );
}
