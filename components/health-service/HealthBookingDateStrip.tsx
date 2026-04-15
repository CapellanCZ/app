import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function monthDayList(year: number, monthIndex: number): Date[] {
  const n = daysInMonth(year, monthIndex);
  return Array.from({ length: n }, (_, i) => startOfDay(new Date(year, monthIndex, i + 1)));
}

const INACTIVE_BG = '#F3F4F6';
const INACTIVE_TEXT = '#9CA3AF';
const BLACK = '#111111';

type CalendarDayPillProps = {
  day: Date;
  selected: boolean;
  onSelect: () => void;
};

function CalendarDayPill({ day, selected, onSelect }: CalendarDayPillProps) {
  const weekday = day.toLocaleDateString(undefined, { weekday: 'short' });
  const dayNum = day.getDate();
  const accessibilityLabel = `${weekday} ${day.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onSelect}
      className="mr-2">
      <View
        style={{
          minWidth: 48,
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: selected ? BLACK : INACTIVE_BG,
        }}>
        <Text
          className="text-[10px] font-semibold uppercase"
          style={{ color: selected ? '#FFFFFF' : INACTIVE_TEXT }}
          numberOfLines={1}>
          {weekday}
        </Text>
        <View
          style={{
            minWidth: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            className="text-[15px] font-bold leading-none"
            style={{ color: selected ? '#FFFFFF' : '#6B7280' }}
            numberOfLines={1}>
            {dayNum}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export type HealthBookingDateStripProps = {
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
};

/**
 * Month header + chevrons + horizontal calendar row (reference-style black selected pill).
 */
export function HealthBookingDateStrip({ selectedDay, onSelectDay }: HealthBookingDateStripProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDay));

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();
  const days = useMemo(() => monthDayList(year, monthIndex), [year, monthIndex]);

  const monthTitle = useMemo(
    () =>
      new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [year, monthIndex],
  );

  const goPrevMonth = () => {
    setViewMonth(new Date(year, monthIndex - 1, 1));
  };

  const goNextMonth = () => {
    setViewMonth(new Date(year, monthIndex + 1, 1));
  };

  return (
    <View
      className="overflow-hidden rounded-2xl border border-black/5 bg-white px-3 pb-3 pt-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}>
      <View className="mb-3 flex-row items-center justify-between px-1">
        <Text className="text-base font-bold text-[#1F2024]">{monthTitle}</Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            hitSlop={10}
            onPress={goPrevMonth}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-black/5">
            <Ionicons name="chevron-back" size={22} color={BLACK} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            hitSlop={10}
            onPress={goNextMonth}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-black/5">
            <Ionicons name="chevron-forward" size={22} color={BLACK} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', paddingRight: 8, paddingLeft: 2 }}>
        {days.map((d) => (
          <CalendarDayPill
            key={d.getTime()}
            day={d}
            selected={isSameDay(d, selectedDay)}
            onSelect={() => onSelectDay(d)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// --- Visit reason / symptoms (booking flow) ---

export type HealthBookingFeelingOption = {
  id: string;
  label: string;
};

export const HEALTH_BOOKING_FEELING_OPTIONS: HealthBookingFeelingOption[] = [
  { id: 'checkup', label: 'General check-up' },
  { id: 'fever', label: 'Fever / flu symptoms' },
  { id: 'pain', label: 'Pain or injury' },
  { id: 'mental', label: 'Stress / mental health' },
  { id: 'digestive', label: 'Digestive issues' },
  { id: 'other', label: 'Something else' },
];

export type HealthBookingFeelingGroupProps = {
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  comments: string;
  onCommentsChange: (text: string) => void;
};

/**
 * Multi-select chips for how the student has been feeling + multiline comments (booking screen).
 */
export function HealthBookingFeelingGroup({
  selectedIds,
  onSelectedIdsChange,
  comments,
  onCommentsChange,
}: HealthBookingFeelingGroupProps) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  return (
    <View>
      <Text className="text-lg font-semibold text-[#1F2024]">What have you been feeling?</Text>
      <Text className="mt-1 text-xs text-[#8F9098]">Select any that apply (optional).</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {HEALTH_BOOKING_FEELING_OPTIONS.map((opt) => {
          const on = selectedIds.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={opt.label}
              onPress={() => toggle(opt.id)}
              className="rounded-full border px-4 py-2.5 active:opacity-85"
              style={{
                borderColor: on ? BLACK : 'rgba(0,0,0,0.08)',
                backgroundColor: on ? BLACK : '#FFFFFF',
              }}>
              <Text
                className="text-sm font-semibold"
                style={{ color: on ? '#FFFFFF' : '#535862' }}
                numberOfLines={2}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-6 text-lg font-semibold text-[#1F2024]">Additional comments</Text>
      <TextInput
        accessibilityLabel="Additional comments for your visit"
        value={comments}
        onChangeText={onCommentsChange}
        placeholder="Anything else we should know before your visit?"
        placeholderTextColor="#8F9098"
        multiline
        textAlignVertical="top"
        className="mt-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#1F2024]"
        style={{ minHeight: 104 }}
      />
    </View>
  );
}
