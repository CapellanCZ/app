import { Pressable, Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import type { StaffRole } from '@/lib/health-service/types';

const CHIP_BG = '#F9F9F9';
const SELECTED_BG = '#0F0E0E';

export type BookingProviderType = Extract<StaffRole, 'doctor' | 'dentist'>;

const OPTIONS: { id: BookingProviderType; label: string }[] = [
  { id: 'doctor', label: 'Physician' },
  { id: 'dentist', label: 'Dentist' },
];

type Props = {
  value: BookingProviderType;
  onChange: (next: BookingProviderType) => void;
};

/** Physician · Dentist row — matches consultation request field styling. */
export function BookingProviderTypeSelect({ value, onChange }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 14,
          color: '#6C6C6C',
          letterSpacing: -0.28,
        }}>
        Provider type
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                if (!selected) onChange(opt.id);
              }}
              {...androidPressProps({ light: selected, hitSlop: 2 })}
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: selected ? SELECTED_BG : CHIP_BG,
                paddingVertical: 14,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: selected ? Inter.medium : Inter.regular,
                  fontSize: 16,
                  color: selected ? '#FFFFFF' : '#111111',
                  letterSpacing: -0.64,
                  textAlign: 'center',
                }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
