import { Pressable, Text, View } from 'react-native';

import type { StaffRole } from '../../lib/health-service/types';

const ROLES: { id: StaffRole | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'nurse', label: 'Nurse' },
  { id: 'dentist', label: 'Dentist' },
];

const BRAND = '#2970FF';

export type RoleFilterChipsProps = {
  value: StaffRole | 'all';
  onChange: (next: StaffRole | 'all') => void;
};

export function RoleFilterChips({ value, onChange }: RoleFilterChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {ROLES.map((r) => {
        const selected = value === r.id;
        return (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Filter providers: ${r.label}`}
            onPress={() => onChange(r.id)}
            className="rounded-full border px-4 py-2 active:opacity-80"
            style={{
              borderColor: selected ? BRAND : 'rgba(0,0,0,0.08)',
              backgroundColor: selected ? BRAND : '#FFFFFF',
            }}>
            <Text
              className="text-sm font-semibold"
              style={{ color: selected ? '#FFFFFF' : '#535862' }}>
              {r.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
