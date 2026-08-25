import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { BookingChevronIcon } from '@/components/booking/BookingIcons';
import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const SELECTED_DAY_BG = '#F3F3F3';
const SELECTED_DAY_BORDER = '#D8D8D8';
const PRESS_SPRING = { damping: 18, stiffness: 420, mass: 0.35 } as const;

function usePressScale(scaleTo = 0.96) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, scaleTo]) }],
  }));
  return {
    animStyle,
    onPressIn: () => {
      pressed.set(withSpring(1, PRESS_SPRING));
    },
    onPressOut: () => {
      pressed.set(withSpring(0, PRESS_SPRING));
    },
  };
}

type DayChipProps = {
  weekday: string;
  dayNumber: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Week day cell — soft selected frame + press scale. */
export function BookingDayChip({
  weekday,
  dayNumber,
  selected,
  disabled = false,
  onPress,
}: DayChipProps) {
  const isSelected = selected && !disabled;
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.94);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...androidPressProps({ hitSlop: 2 })}
      style={{ flex: 1, flexBasis: 0, overflow: 'hidden', borderRadius: 14 }}>
      <Animated.View
        style={[
          animStyle,
          {
            minHeight: 64,
            borderRadius: 14,
            backgroundColor: isSelected ? SELECTED_DAY_BG : 'transparent',
            borderWidth: 1,
            borderColor: isSelected ? SELECTED_DAY_BORDER : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 2,
            paddingVertical: 10,
            opacity: disabled ? 0.4 : 1,
          },
        ]}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: disabled ? '#B0B0B0' : isSelected ? '#111111' : '#9E9E9E',
            letterSpacing: -0.48,
          }}>
          {weekday}
        </Text>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 16,
            color: disabled ? '#B0B0B0' : isSelected ? '#111111' : '#9E9E9E',
            letterSpacing: -0.64,
            textDecorationLine: disabled ? 'line-through' : 'none',
          }}>
          {dayNumber}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

type SlotChipProps = {
  label: string;
  selected: boolean;
  booked?: boolean;
  onPress: () => void;
};

/** Selected: solid near-black + soft glow. Unselected: fill only (no border). */
export function BookingSlotChip({ label, selected, booked = false, onPress }: SlotChipProps) {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <Animated.View
      style={[
        animStyle,
        {
          flex: 1,
          flexBasis: 0,
          minWidth: 0,
          borderRadius: 16,
          backgroundColor: selected ? 'rgba(255,255,255,0.65)' : 'transparent',
          shadowColor: selected ? '#FFFFFF' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: selected ? 1 : 0,
          shadowRadius: selected ? 14 : 0,
          elevation: selected ? 8 : 0,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: booked }}
        disabled={booked}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...androidPressProps({ light: selected, hitSlop: 2 })}
        style={{
          borderRadius: 16,
          backgroundColor: selected ? '#0F0E0E' : '#F4F4F4',
          paddingVertical: 14,
          paddingHorizontal: 10,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: booked ? 0.45 : 1,
          shadowColor: selected ? '#D0D0D0' : 'transparent',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: selected ? 0.45 : 0,
          shadowRadius: selected ? 12 : 0,
        }}>
        <Text
          style={{
            fontFamily: selected ? Inter.medium : Inter.regular,
            fontSize: 15,
            color: selected ? '#FFFFFF' : '#6C6C6C',
            letterSpacing: -0.6,
            textAlign: 'center',
            textDecorationLine: booked ? 'line-through' : 'none',
          }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

type NavCircleProps = {
  onPress: () => void;
  accessibilityLabel: string;
  backgroundColor: string;
  chevronColor: string;
  mirror?: boolean;
};

function BookingNavCircle({
  onPress,
  accessibilityLabel,
  backgroundColor,
  chevronColor,
  mirror = false,
}: NavCircleProps) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.get(), [0, 1], [1, 0.9]);
    return {
      transform: mirror
        ? [{ scaleX: -1 * scale }, { scaleY: scale }]
        : [{ scale }],
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        pressed.set(withSpring(1, PRESS_SPRING));
      }}
      onPressOut={() => {
        pressed.set(withSpring(0, PRESS_SPRING));
      }}
      {...androidPressProps({ borderless: true, hitSlop: 8 })}>
      <Animated.View
        style={[
          animStyle,
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
        ]}>
        <BookingChevronIcon size={18} color={chevronColor} />
      </Animated.View>
    </Pressable>
  );
}

type SheetHeaderProps = {
  monthLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

/** Month label + circular week nav (prev light / next black). */
export function BookingSheetHeader({ monthLabel, onPrevWeek, onNextWeek }: SheetHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text
        style={{
          fontFamily: Inter.semiBold,
          fontSize: 22,
          color: '#111111',
          letterSpacing: -1.2,
          lineHeight: 28,
        }}>
        {monthLabel}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <BookingNavCircle
          accessibilityLabel="Previous week"
          onPress={onPrevWeek}
          backgroundColor="#F0F0F0"
          chevronColor="#6C6C6C"
          mirror
        />
        <BookingNavCircle
          accessibilityLabel="Next week"
          onPress={onNextWeek}
          backgroundColor="#000000"
          chevronColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

type SlotItem = {
  label: string;
  booked: boolean;
};

type PeriodSectionProps = {
  title: string;
  items: SlotItem[];
  selectedSlot: string | null;
  onSelect: (label: string) => void;
  initialVisible?: number;
};

function chunkSlots(items: SlotItem[], size = 3): SlotItem[][] {
  const rows: SlotItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * Morning / Afternoon block — shows `initialVisible` slots, chevron reveals the rest.
 */
export function BookingPeriodSection({
  title,
  items,
  selectedSlot,
  onSelect,
  initialVisible = 6,
}: PeriodSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = items.length > initialVisible;
  const visibleItems =
    expanded || !canExpand ? items : items.slice(0, initialVisible);
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.98);

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          canExpand
            ? `${title}, ${expanded ? 'collapse' : 'show all'} time slots`
            : title
        }
        accessibilityState={{ expanded: canExpand ? expanded : undefined }}
        disabled={!canExpand}
        onPress={() => setExpanded((v) => !v)}
        onPressIn={canExpand ? onPressIn : undefined}
        onPressOut={canExpand ? onPressOut : undefined}>
        <Animated.View
          style={[
            canExpand ? animStyle : null,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 2,
            },
          ]}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 15,
              color: '#111111',
              letterSpacing: -0.3,
            }}>
            {title}
          </Text>
          {canExpand ? (
            <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
              <IconsaxArrowDownIcon size={16} color="#717680" />
            </View>
          ) : null}
        </Animated.View>
      </Pressable>

      {chunkSlots(visibleItems).map((row, rowIndex) => (
        <View
          key={`${title}-${rowIndex}`}
          style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((slot) => (
            <BookingSlotChip
              key={slot.label}
              label={slot.label}
              selected={selectedSlot === slot.label}
              booked={slot.booked}
              onPress={() => onSelect(slot.label)}
            />
          ))}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }).map((_, i) => (
                <View key={`pad-${i}`} style={{ flex: 1, flexBasis: 0 }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

type BookButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function BookingPrimaryButton({ disabled, loading, onPress }: BookButtonProps) {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.98);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loading ? 'Booking appointment' : 'Book appointment'}
      accessibilityState={{ busy: Boolean(loading), disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={inactive ? undefined : onPressIn}
      onPressOut={inactive ? undefined : onPressOut}
      {...androidPressProps({ light: true, hitSlop: 4 })}>
      <Animated.View
        style={[
          inactive ? null : animStyle,
          {
            width: '100%',
            height: 48,
            borderRadius: 48,
            overflow: 'hidden',
            backgroundColor: '#000000',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: inactive ? 0.45 : 1,
            // Soft light lift — no extra fill behind the black pill
            shadowColor: '#C8C8C8',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: inactive ? 0 : 0.5,
            shadowRadius: 14,
            elevation: inactive ? 0 : 6,
          },
        ]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 16,
              color: '#FFFFFF',
              textTransform: 'capitalize',
              lineHeight: 16,
            }}>
            Book Appointment
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
