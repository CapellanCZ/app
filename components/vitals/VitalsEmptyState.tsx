import { Text, View } from 'react-native';

import { FigmaVitalsIcon } from '@/components/home/FigmaHomeIcons';
import { Inter } from '@/lib/typography/inter';

/** Shown when the clinic has not recorded vitals yet. */
export function VitalsEmptyState() {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 32,
        alignItems: 'center',
        gap: 12,
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#D3E9FA',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FigmaVitalsIcon size={26} color="#4D7A9A" />
      </View>
      <Text
        style={{
          fontFamily: Inter.semiBold,
          fontSize: 18,
          color: '#222222',
          letterSpacing: -0.72,
          lineHeight: 24,
          textAlign: 'center',
        }}>
        No vitals recorded yet
      </Text>
      <Text
        style={{
          fontFamily: Inter.regular,
          fontSize: 14,
          color: 'rgba(114, 114, 114, 0.85)',
          letterSpacing: -0.28,
          lineHeight: 20,
          textAlign: 'center',
          maxWidth: 280,
        }}>
        Visit the campus clinic for a check-up. Your blood pressure, heart rate, and other
        measurements will appear here after your visit.
      </Text>
    </View>
  );
}
