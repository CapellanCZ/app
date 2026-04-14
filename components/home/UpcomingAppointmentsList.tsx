import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type UpcomingAppointmentTone = 'purple' | 'blue' | 'orange';

export type UpcomingAppointmentListItem = {
  id: string;
  timeLabel: string;
  title: string;
  subtitle: string;
  tone: UpcomingAppointmentTone;
  onPress?: () => void;
};

const TONE = {
  purple: { bg: '#EDE9FE', text: '#5B21B6' },
  blue: { bg: '#DBEAFE', text: '#1D4ED8' },
  orange: { bg: '#FFEDD5', text: '#C2410C' },
} as const;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;

export type UpcomingAppointmentsListProps = {
  items: UpcomingAppointmentListItem[];
  className?: string;
};

/**
 * Flat appointment rows: pastel time pill, title + subtitle, chevron (reference home design).
 */
export function UpcomingAppointmentsList({ items, className }: UpcomingAppointmentsListProps) {
  return (
    <View
      className={`overflow-hidden rounded-3xl bg-white ${className ?? ''}`}
      style={CARD_SHADOW}>
      {items.length === 0 ? (
        <Text className="px-4 py-10 text-center text-sm text-[#8F9098]">No appointments for this day.</Text>
      ) : (
        items.map((item, index) => {
          const colors = TONE[item.tone];
          return (
            <View key={item.id}>
              {index > 0 ? <View className="mx-4 h-px bg-[#EEF0F3]" /> : null}
              <Pressable
                accessibilityRole={item.onPress ? 'button' : undefined}
                accessibilityLabel={`${item.timeLabel}, ${item.title}, ${item.subtitle}`}
                className="flex-row items-center gap-3 px-4 py-4 active:bg-[#FAFAFA]"
                disabled={!item.onPress}
                onPress={item.onPress}>
                <View
                  className="min-w-[76px] items-center justify-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: colors.bg }}>
                  <Text className="text-center text-xs font-bold" style={{ color: colors.text }}>
                    {item.timeLabel}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[15px] font-semibold text-[#1F2024]" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-sm text-[#8F9098]" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C5C6CC" />
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}
