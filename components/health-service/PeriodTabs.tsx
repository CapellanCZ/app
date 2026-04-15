import { Pressable, Text, View } from 'react-native';

import type { SlotPeriod } from '../../lib/health-service/types';

const BRAND = '#2970FF';

const TABS: { id: SlotPeriod; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' },
];

export type PeriodTabsProps = {
  value: SlotPeriod;
  onChange: (next: SlotPeriod) => void;
};

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {TABS.map((t) => {
        const selected = value === t.id;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t.label} time slots`}
            onPress={() => onChange(t.id)}
            className="rounded-full px-4 py-2 active:opacity-85"
            style={{
              backgroundColor: selected ? BRAND : '#F3F4F6',
            }}>
            <Text
              className="text-sm font-semibold"
              style={{ color: selected ? '#FFFFFF' : '#535862' }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
