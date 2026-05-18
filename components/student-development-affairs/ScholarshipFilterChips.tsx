import { Pressable, ScrollView, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import {
  SCHOLARSHIP_CHIP_FILTERS,
  type ScholarshipListFilter,
} from '@/lib/scholarships/programUtils';

const BRAND = '#2970FF';
const PRESS_SPRING = { damping: 20, stiffness: 420, mass: 0.32 } as const;

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
        }}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 99999,
          backgroundColor: selected ? '#EFF4FF' : '#F5F5F5',
        }}
        className="active:opacity-80">
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
    </Animated.View>
  );
}

export type ScholarshipFilterChipsProps = {
  activeFilter: ScholarshipListFilter;
  onFilterChange: (filter: ScholarshipChipFilter) => void;
};

export function ScholarshipFilterChips({ activeFilter, onFilterChange }: ScholarshipFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
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
