import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { Staff } from '../../lib/health-service/types';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;

const BRAND = '#2970FF';

function roleLabel(role: Staff['role']): string {
  if (role === 'doctor') return 'Doctor';
  if (role === 'nurse') return 'Nurse';
  return 'Dentist';
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s+/i, '').split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

export type ProviderCardProps = {
  staff: Staff;
  availableToday: boolean;
  onBook: () => void;
};

export function ProviderCard({ staff, availableToday, onBook }: ProviderCardProps) {
  return (
    <View
      className="overflow-hidden rounded-3xl border border-black/5 bg-white p-4"
      style={CARD_SHADOW}>
      <View className="flex-row items-start gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F8FF]">
          <Text className="text-base font-bold text-[#2970FF]">{initials(staff.name)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-[#1F2024]" numberOfLines={1}>
            {staff.name}
          </Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-[#E8EFFF] px-2.5 py-0.5">
              <Text className="text-xs font-semibold text-[#1D4ED8]">{roleLabel(staff.role)}</Text>
            </View>
            <Text className="text-xs text-[#8F9098]" numberOfLines={1}>
              {staff.specialtyLabel}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center gap-2">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: availableToday ? '#22C55E' : '#D1D5DB' }}
              accessibilityElementsHidden
            />
            <Text className="text-xs font-medium text-[#535862]">
              {availableToday ? 'Available today' : 'Not in today'}
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Request an appointment with ${staff.name}`}
        onPress={onBook}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl py-3 active:opacity-90"
        style={{ backgroundColor: BRAND }}>
        <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
        <Text className="text-sm font-semibold text-white">Request</Text>
      </Pressable>
    </View>
  );
}
