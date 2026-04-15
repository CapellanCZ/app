import { Pressable, Text, View } from 'react-native';

const BRAND = '#2970FF';

export type TimeSlotGridProps = {
  labels: string[];
  selectedLabel: string | null;
  onSelect: (label: string) => void;
};

export function TimeSlotGrid({ labels, selectedLabel, onSelect }: TimeSlotGridProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {labels.map((label) => {
        const selected = selectedLabel === label;
        return (
          <View key={label} className="w-[31%]">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Book time ${label}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(label)}
              className="items-center justify-center rounded-2xl border py-3 active:opacity-85"
              style={{
                borderColor: selected ? BRAND : 'rgba(0,0,0,0.08)',
                backgroundColor: selected ? 'rgba(41,112,255,0.08)' : '#FFFFFF',
              }}>
              <Text
                className="text-sm font-semibold"
                style={{ color: selected ? BRAND : '#1F2024' }}
                numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
