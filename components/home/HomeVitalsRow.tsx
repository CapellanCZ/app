import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { FigmaDropletIcon, FigmaHeartRateIcon } from '@/components/home/FigmaHomeIcons';
import { Inter } from '@/lib/typography/inter';

type VitalCardProps = {
  label: string;
  value: string;
  status: string;
  backgroundColor: string;
  icon: ReactNode;
};

function VitalCard({ label, value, status, backgroundColor, icon }: VitalCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 18,
        gap: 24,
        minHeight: 120,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text
          style={{
            flex: 1,
            fontFamily: Inter.regular,
            fontSize: 14,
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
            fontSize: 26,
            color: '#111111',
            lineHeight: 32,
          }}>
          {value}
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#373636',
            letterSpacing: -0.4,
          }}>
          {status}
        </Text>
      </View>
    </View>
  );
}

type Props = {
  bloodPressure?: string | null;
  heartRate?: string | null;
};

/**
 * Figma "Your Vitals" dual cards. Values optional — em dash when unavailable.
 */
export function HomeVitalsRow({ bloodPressure, heartRate }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
      <VitalCard
        label="Blood Pressure"
        value={bloodPressure?.trim() || '—'}
        status={bloodPressure ? 'Good' : 'No recent reading'}
        backgroundColor="#F4EDD6"
        icon={<FigmaDropletIcon size={22} />}
      />
      <VitalCard
        label="Avg. Heart Rate"
        value={heartRate?.trim() || '—'}
        status={heartRate ? 'Good' : 'No recent reading'}
        backgroundColor="#F4E2FC"
        icon={<FigmaHeartRateIcon size={22} />}
      />
    </View>
  );
}
