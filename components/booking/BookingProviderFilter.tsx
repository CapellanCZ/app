import { Pressable, Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

export type BookingProviderFilterId = 'all' | 'doctor' | 'dentist';

export const BOOKING_PROVIDER_FILTERS: { id: BookingProviderFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'dentist', label: 'Dentist' },
];

type Props = {
  value: BookingProviderFilterId;
  onChange: (next: BookingProviderFilterId) => void;
};

/**
 * Doctor · Dentist filter row — white chips on grey, black selected (Book tab).
 */
export function BookingProviderFilter({ value, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {BOOKING_PROVIDER_FILTERS.map((chip) => {
        const selected = value === chip.id;
        return (
          <Pressable
            key={chip.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (chip.id !== value) onChange(chip.id);
            }}
            {...androidPressProps({ hitSlop: 2 })}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
              backgroundColor: selected ? '#111111' : '#FFFFFF',
              borderWidth: selected ? 0 : 1,
              borderColor: '#E3E3E3',
              opacity: pressed ? 0.88 : 1,
            })}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Inter.medium,
                fontSize: 15,
                color: selected ? '#FFFFFF' : '#727272',
                letterSpacing: -0.4,
                textAlign: 'center',
              }}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
