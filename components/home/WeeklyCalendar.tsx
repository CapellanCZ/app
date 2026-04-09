import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

const WEEKDAY_LABELS_MON_FIRST = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Monday-first week: returns 7 dates from the Monday of the week containing `anchor`. */
function getWeekDaysMondayFirst(anchor: Date): Date[] {
  const s = startOfDay(anchor);
  const day = s.getDay();
  const diffFromMonday = day === 0 ? -6 : 1 - day;
  s.setDate(s.getDate() + diffFromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(s);
    x.setDate(s.getDate() + i);
    return x;
  });
}

type DayVisualState = 'default' | 'current' | 'selected';

function dayCellState(day: Date, selectedDate: Date, today: Date): DayVisualState {
  if (isSameDay(day, selectedDate)) {
    return 'selected';
  }
  if (isSameDay(day, today)) {
    return 'current';
  }
  return 'default';
}

type DayCellProps = {
  weekday: string;
  dayOfMonth: number;
  state: DayVisualState;
  onPress: () => void;
  accessibilityLabel: string;
  /** Extra classes on the rounded day box (padding, radius, min size). */
  containerClassName?: string;
};

function DayCell({
  weekday,
  dayOfMonth,
  state,
  onPress,
  accessibilityLabel,
  containerClassName,
}: DayCellProps) {
  const selected = state === 'selected';
  const current = state === 'current';

  const containerClass = selected
    ? 'bg-[#006FFD]'
    : current
      ? 'bg-[#F5F5F5]'
      : 'bg-[#FAFAFA]';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      className="flex-1"
      onPress={onPress}>
      <View
        className={`items-center justify-center gap-1.5 rounded-2xl px-0 py-3.5 ${containerClass} ${containerClassName ?? ''}`}>
        <Text
          className={`text-center text-[10px] font-semibold uppercase ${
            selected ? 'text-[#B4DBFF]' : 'text-[#8F9098]'
          }`}
          numberOfLines={1}
          style={{ letterSpacing: 0.5 }}>
          {weekday}
        </Text>
        <Text
          className={`text-center text-[20px] font-normal leading-[22px] ${
            selected ? 'text-white' : 'text-[#494A50]'
          }`}
          numberOfLines={1}>
          {dayOfMonth}
        </Text>
      </View>
    </Pressable>
  );
}

export type WeeklyCalendarProps = {
  /** Highlighted day (controlled). Compared by calendar date in local time. */
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Any date in the week to display; defaults to `selectedDate`. */
  weekReferenceDate?: Date;
  className?: string;
  /**
   * Tailwind classes merged onto each day’s inner box. Shrink with smaller padding/radius/text via wrappers, e.g.
   * `!py-2 !px-1 !rounded-xl` etc. Avoid `!min-w-0` on the cell — it lets columns shrink and clips labels.
   */
  dayCellClassName?: string;
};

/**
 * Horizontal week strip (Figma node 703:33227). Monday–Sunday; “today” uses gray-100, selection uses brand blue #006FFD.
 */
export function WeeklyCalendar({
  selectedDate,
  onSelectDate,
  weekReferenceDate,
  className,
  dayCellClassName,
}: WeeklyCalendarProps) {
  const today = startOfDay(new Date());
  const anchor = weekReferenceDate ?? selectedDate;
  const weekDays = useMemo(() => getWeekDaysMondayFirst(anchor), [anchor]);

  return (
    <View className={`flex-row items-start gap-2 py-2 ${className ?? ''}`}>
      {weekDays.map((day, index) => {
        const weekday = WEEKDAY_LABELS_MON_FIRST[index];
        const state = dayCellState(day, selectedDate, today);
        const label = day.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        return (
          <DayCell
            key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
            accessibilityLabel={label}
            containerClassName={dayCellClassName}
            dayOfMonth={day.getDate()}
            state={state}
            weekday={weekday}
            onPress={() => onSelectDate(startOfDay(day))}
          />
        );
      })}
    </View>
  );
}
