import { Pressable, Text, View } from 'react-native';

import { IconsaxTimerIcon } from '@/components/icons/IconsaxTimerIcon';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { BRAND, CARD_ELEVATION } from '@/lib/ui/theme';

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
const DAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isPastDay(day: Date): boolean {
  return startOfDay(day).getTime() < startOfDay(new Date()).getTime();
}

/** Monday-first month cells (null = empty leading/trailing pad). */
function buildMonthCells(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0
  const cells: (Date | null)[] = Array.from({ length: mondayIndex }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function formatSelectedAppointmentDate(date: Date): string {
  return `${DAY_LONG[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

type Props = {
  visibleMonth: Date;
  selectedDay: Date;
  /** Return false to gray-out / block selection (past days always blocked). */
  isDayBookable: (day: Date) => boolean;
  onSelectDay: (day: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** Hide previous when already at the current month. */
  canGoPrev: boolean;
};

/**
 * Month grid + selected-date banner — matches Book Appointment calendar mockup.
 */
export function BookingMonthCalendar({
  visibleMonth,
  selectedDay,
  isDayBookable,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  canGoPrev,
}: Props) {
  const cells = buildMonthCells(visibleMonth);
  const today = startOfDay(new Date());
  const monthLabel = `${MONTH_SHORT[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          backgroundColor: '#F7F7F8',
          borderRadius: 20,
          borderCurve: 'continuous',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 14,
          borderWidth: 1,
          borderColor: '#ECECEC',
          ...CARD_ELEVATION,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 18,
              color: '#111111',
              letterSpacing: -0.6,
            }}>
            {monthLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              disabled={!canGoPrev}
              onPress={onPrevMonth}
              {...androidPressProps({ hitSlop: 8 })}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !canGoPrev ? 0.35 : pressed ? 0.7 : 1,
              })}>
              <Text style={{ fontSize: 22, color: '#6C6C6C', lineHeight: 24 }}>{'‹'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={onNextMonth}
              {...androidPressProps({ hitSlop: 8 })}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text style={{ fontSize: 22, color: '#6C6C6C', lineHeight: 24 }}>{'›'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {WEEKDAYS.map((label) => (
            <View key={label} style={{ flex: 1, alignItems: 'center', paddingBottom: 8 }}>
              <Text
                style={{
                  fontFamily: Inter.medium,
                  fontSize: 12,
                  color: '#9CA3AF',
                  letterSpacing: 0.4,
                }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 4 }}>
          {Array.from({ length: cells.length / 7 }, (_, row) => (
            <View key={`row-${row}`} style={{ flexDirection: 'row' }}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) {
                  return <View key={`empty-${row}-${col}`} style={{ flex: 1, height: 40 }} />;
                }

                const selected = isSameDay(day, selectedDay);
                const isToday = isSameDay(day, today);
                const past = isPastDay(day);
                const bookable = !past && isDayBookable(day);
                const muted = past || !bookable;

                return (
                  <Pressable
                    key={day.toISOString()}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: muted }}
                    accessibilityLabel={day.toDateString()}
                    disabled={muted}
                    onPress={() => onSelectDay(startOfDay(day))}
                    {...androidPressProps({ hitSlop: 2 })}
                    style={{
                      flex: 1,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected
                          ? BRAND.primaryCard
                          : isToday
                            ? '#E8E8EA'
                            : 'transparent',
                      }}>
                      <Text
                        style={{
                          fontFamily: selected ? Inter.semiBold : Inter.medium,
                          fontSize: 15,
                          color: selected ? '#FFFFFF' : muted ? '#C4C4C8' : '#222222',
                          letterSpacing: -0.3,
                        }}>
                        {day.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: BRAND.primaryCard,
          borderRadius: 18,
          borderCurve: 'continuous',
          paddingHorizontal: 18,
          paddingVertical: 16,
          gap: 8,
          borderWidth: 1,
          borderColor: BRAND.primaryCardDeep,
          ...CARD_ELEVATION,
        }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 11,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>
          Your selected appointment date
        </Text>
        <Text
          style={{
            fontFamily: Inter.semiBold,
            fontSize: 20,
            color: '#FFFFFF',
            letterSpacing: -0.8,
            lineHeight: 26,
          }}>
          {formatSelectedAppointmentDate(selectedDay)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <IconsaxTimerIcon size={14} color="rgba(255,255,255,0.9)" />
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 13,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: -0.2,
              flex: 1,
            }}>
            Pick a time below that works for your visit
          </Text>
        </View>
      </View>
    </View>
  );
}

export { startOfMonth };
