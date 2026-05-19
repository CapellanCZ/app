import { Pressable, ScrollView, Text } from 'react-native';

import {
  SCHOLARSHIP_CHIP_FILTERS,
  type ScholarshipListFilter,
} from '@/lib/scholarships/programUtils';

const BRAND = '#2970FF';

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 99999,
        backgroundColor: selected ? '#EFF4FF' : '#F5F5F5',
      }}
      className="active:opacity-90">
      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          letterSpacing: -0.24,
          color: selected ? BRAND : '#717680',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export type ScholarshipFilterChipsProps = {
  activeFilter: ScholarshipListFilter;
  onFilterChange: (filter: ScholarshipListFilter) => void;
};

export function ScholarshipFilterChips({ activeFilter, onFilterChange }: ScholarshipFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      alwaysBounceHorizontal={false}
      contentContainerStyle={{ gap: 8 }}>
      {SCHOLARSHIP_CHIP_FILTERS.map((chip) => (
        <FilterChip
          key={chip.key}
          label={chip.label}
          selected={activeFilter === chip.key}
          onPress={() => onFilterChange(chip.key)}
        />
      ))}
    </ScrollView>
  );
}
