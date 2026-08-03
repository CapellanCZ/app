import { Pressable, Text, View } from 'react-native';

import { BookingChevronIcon, BookingClockIcon } from '@/components/booking/BookingIcons';
import { Inter } from '@/lib/typography/inter';

const CHIP_BG = '#F9F9F9';
const SELECTED_BG = '#0F0E0E';

type DayChipProps = {
  weekday: string;
  dayNumber: string;
  selected: boolean;
  /** No clinic schedule for this weekday (or otherwise not bookable). */
  disabled?: boolean;
  onPress: () => void;
};

export function BookingDayChip({
  weekday,
  dayNumber,
  selected,
  disabled = false,
  onPress,
}: DayChipProps) {
  const isSelected = selected && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        flexBasis: 0,
        height: 78,
        borderRadius: 16,
        backgroundColor: disabled ? '#F3F3F3' : isSelected ? SELECTED_BG : CHIP_BG,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 4,
        paddingVertical: 12,
        opacity: disabled ? 0.45 : 1,
      }}>
      <Text
        style={{
          fontFamily: Inter.regular,
          fontSize: 12,
          color: disabled ? '#B0B0B0' : isSelected ? '#A7A7A7' : '#6C6C6C',
          letterSpacing: -0.48,
        }}>
        {weekday}
      </Text>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          color: disabled ? '#B0B0B0' : isSelected ? '#FFFFFF' : '#111111',
          letterSpacing: -0.64,
          textDecorationLine: disabled ? 'line-through' : 'none',
        }}>
        {dayNumber}
      </Text>
    </Pressable>
  );
}

type SlotChipProps = {
  label: string;
  selected: boolean;
  booked?: boolean;
  onPress: () => void;
};

export function BookingSlotChip({ label, selected, booked = false, onPress }: SlotChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: booked }}
      disabled={booked}
      onPress={onPress}
      style={{
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        borderRadius: 16,
        backgroundColor: selected ? '#050505' : CHIP_BG,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          fontFamily: Inter.regular,
          fontSize: 16,
          color: selected ? '#FFFFFF' : '#6C6C6C',
          letterSpacing: -0.64,
          textAlign: 'center',
          textDecorationLine: booked ? 'line-through' : 'none',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

type SheetHeaderProps = {
  monthLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export function BookingSheetHeader({ monthLabel, onPrevWeek, onNextWeek }: SheetHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#A7A7A7',
            letterSpacing: -0.48,
          }}>
          {monthLabel}
        </Text>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 20,
            color: '#111111',
            letterSpacing: -1.6,
            lineHeight: 28,
          }}>
          Book Appointment
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          onPress={onPrevWeek}
          hitSlop={8}
          style={{ padding: 4, transform: [{ scaleX: -1 }] }}>
          <BookingChevronIcon size={20} color="#6C6C6C" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next week"
          onPress={onNextWeek}
          hitSlop={8}
          style={{ padding: 4 }}>
          <BookingChevronIcon size={20} color="#6C6C6C" />
        </Pressable>
      </View>
    </View>
  );
}

type ChooseTimeProps = {
  onPress?: () => void;
};

export function BookingChooseTimeRow({ onPress }: ChooseTimeProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Choose time"
      onPress={onPress}
      style={{
        width: '100%',
        backgroundColor: CHIP_BG,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}>
      <BookingClockIcon size={20} color="#6C6C6C" />
      <Text
        style={{
          fontFamily: Inter.regular,
          fontSize: 16,
          color: '#6C6C6C',
          letterSpacing: -0.64,
        }}>
        Choose time
      </Text>
    </Pressable>
  );
}

type BookButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function BookingPrimaryButton({ disabled, loading, onPress }: BookButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Book appointment"
      disabled={disabled || loading}
      onPress={onPress}
      style={{
        width: '100%',
        height: 48,
        borderRadius: 48,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.45 : 1,
      }}>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          color: '#FFFFFF',
          textTransform: 'capitalize',
          lineHeight: 16,
        }}>
        {loading ? 'Booking…' : 'Book Appointment'}
      </Text>
    </Pressable>
  );
}
