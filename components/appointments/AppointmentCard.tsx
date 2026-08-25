import { Image, Linking, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  FigmaAppointmentCalendarIcon,
  FigmaAppointmentClockIcon,
  FigmaAppointmentPersonIcon,
} from '@/components/appointments/FigmaAppointmentIcons';
import { BookingChevronIcon } from '@/components/booking/BookingIcons';
import { IconsaxCallFilledIcon } from '@/components/icons/IconsaxCallFilledIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import { IconsaxTickCircleIcon } from '@/components/icons/IconsaxTickCircleIcon';
import { fadeSlideUpEntering, fadeSlideUpExiting } from '@/lib/animations/fadeSlideUp';
import type { AppointmentStatus } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

/** Pastel card fills from Figma 2229:518 / 1464 / 1510 — cycle by list index. */
export const APPOINTMENT_CARD_COLORS = ['#D3E9FA', '#F4EDD6', '#F4E2FC'] as const;

const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;

const STATUS_ICON: Partial<
  Record<AppointmentStatus, { color: string; label: string; kind: 'clock' | 'check' }>
> = {
  /** Soft warm tone — fits cream / pastel cards */
  pending: { color: '#8A6A3D', label: 'Pending', kind: 'clock' },
  /** Dusty blue — fits blue pastel cards */
  confirmed: { color: '#4D7A9A', label: 'Confirmed', kind: 'check' },
};

export type AppointmentCardVariant = 'upcoming' | 'past' | 'cancelled';

type Props = {
  variant: AppointmentCardVariant;
  staffName: string;
  staffSpecialty?: string;
  staffPhoto?: string | null;
  /** Left meta — date, or combined "6 Aug, Thu, 9:20 PM" for upcoming. */
  dateLabel: string;
  /** Right meta — consultation type (past) or cancel reason (cancelled). Hidden on upcoming. */
  secondaryLabel?: string;
  /** Pastel background — pass from APPOINTMENT_CARD_COLORS[index % 3]. */
  backgroundColor: string;
  /** Upcoming only — drives the status icon next to call. */
  status?: Extract<AppointmentStatus, 'pending' | 'confirmed'>;
  phoneNumber?: string | null;
  onReschedule?: () => void;
  /** Past chevron / card press. Cancelled rows typically omit. */
  onPress?: () => void;
  /** List index for staggered enter; omit to skip enter animation. */
  enterIndex?: number;
};

/**
 * Appointment list card — Figma Upcoming / Past / Cancelled variants.
 */
export function AppointmentCard({
  variant,
  staffName,
  staffSpecialty = 'Physician',
  staffPhoto,
  dateLabel,
  secondaryLabel,
  backgroundColor,
  status,
  phoneNumber,
  onReschedule,
  onPress,
  enterIndex,
}: Props) {
  const initial = staffName.trim().charAt(0).toUpperCase() || '?';
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);
  const canPress = Boolean(onPress);
  const statusMeta = status ? STATUS_ICON[status] : undefined;

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  const onCall = () => {
    const digits = phoneNumber?.replace(/[^\d+]/g, '');
    if (!digits) return;
    void Linking.openURL(`tel:${digits}`);
  };

  const showCall = variant === 'upcoming' || variant === 'cancelled';
  const showChevron = variant === 'past';
  const showSecondary = Boolean(secondaryLabel) && variant !== 'upcoming';
  const secondaryIsType = variant === 'past' || variant === 'cancelled';
  const statusLabel = statusMeta?.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${staffName}, ${dateLabel}${
        secondaryLabel ? `, ${secondaryLabel}` : ''
      }${statusLabel ? `, ${statusLabel}` : ''}`}
      disabled={!canPress}
      onPress={onPress}
      {...androidPressProps({ hitSlop: 2 })}
      onPressIn={() => {
        if (!canPress || reduceMotion) return;
        scale.value = withSpring(0.97, PRESS_SPRING);
        dim.value = withSpring(0.92, PRESS_SPRING);
      }}
      onPressOut={() => {
        if (!canPress) return;
        scale.value = withSpring(1, PRESS_SPRING);
        dim.value = withSpring(1, PRESS_SPRING);
      }}>
      <Animated.View
        entering={
          enterIndex != null && !reduceMotion ? fadeSlideUpEntering(enterIndex) : undefined
        }
        exiting={reduceMotion ? undefined : fadeSlideUpExiting()}>
        <Animated.View
          style={[
            {
              backgroundColor,
              borderWidth: 1,
              borderColor: '#FFFFFF',
              borderRadius: 16,
              paddingTop: 18,
              paddingBottom: 12,
              paddingHorizontal: 16,
              width: '100%',
              gap: 10,
            },
            pressStyle,
          ]}>
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.16)',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  flex: 1,
                  minWidth: 0,
                }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  {staffPhoto ? (
                    <Image
                      source={{ uri: staffPhoto }}
                      style={{ width: 44, height: 44 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: Inter.medium,
                        fontSize: 20,
                        color: '#6B7280',
                      }}>
                      {initial}
                    </Text>
                  )}
                </View>

                <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
                  {variant === 'past' ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 14,
                        color: '#3F3F3F',
                        letterSpacing: -1.12,
                        lineHeight: 16,
                      }}>
                      Attended by
                    </Text>
                  ) : null}
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 16,
                      color: '#000000',
                      letterSpacing: -0.64,
                      lineHeight: 18,
                    }}>
                    {staffName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 14,
                      color: '#3F3F3F',
                      letterSpacing: -1.12,
                      lineHeight: 16,
                    }}>
                    {staffSpecialty}
                  </Text>
                </View>
              </View>

              {showCall ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={phoneNumber ? `Call ${staffName}` : 'Call unavailable'}
                  disabled={!phoneNumber}
                  onPress={onCall}
                  {...androidPressProps({ borderless: true, hitSlop: 8 })}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.51)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                opacity: !phoneNumber ? 0.55 : pressed ? 0.85 : 1,
              })}>
                  <IconsaxCallFilledIcon size={16} color="#1F2024" />
                </Pressable>
              ) : null}

              {showChevron ? (
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.51)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <BookingChevronIcon size={24} color="#6C6C6C" />
                </View>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: variant === 'upcoming' ? 'space-between' : 'flex-start',
                columnGap: variant === 'upcoming' ? 20 : 16,
                rowGap: 10,
                paddingHorizontal: 10,
                paddingTop: 6,
                minHeight: 28,
                width: '100%',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 1,
                  minWidth: 0,
                  paddingRight: variant === 'upcoming' ? 12 : 0,
                }}>
                <FigmaAppointmentCalendarIcon size={20} color="#3F3F3F" />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 14,
                    color: '#3F3F3F',
                    letterSpacing: -1.12,
                  }}>
                  {dateLabel}
                </Text>
              </View>

              {showSecondary ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 1,
                    minWidth: 0,
                  }}>
                  {secondaryIsType ? (
                    <FigmaAppointmentPersonIcon size={20} color="#3F3F3F" />
                  ) : (
                    <FigmaAppointmentClockIcon size={20} color="#3F3F3F" />
                  )}
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 14,
                      color: '#3F3F3F',
                      letterSpacing: -1.12,
                    }}>
                    {secondaryLabel}
                  </Text>
                </View>
              ) : null}

              {variant === 'upcoming' && statusMeta ? (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={statusMeta.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    marginLeft: 8,
                  }}>
                  {statusMeta.kind === 'clock' ? (
                    <IconsaxClockIcon size={18} color={statusMeta.color} />
                  ) : (
                    <IconsaxTickCircleIcon size={18} color={statusMeta.color} />
                  )}
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 14,
                      color: statusMeta.color,
                      letterSpacing: -1.12,
                    }}>
                    {statusMeta.label}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {variant === 'cancelled' && onReschedule ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reschedule appointment"
              onPress={onReschedule}
              {...androidPressProps({ hitSlop: 2 })}
              style={({ pressed }) => ({
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.83)',
                borderWidth: 1,
                borderColor: '#E3E3E3',
                borderRadius: 16,
                paddingVertical: 8,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                opacity: pressed ? 0.88 : 1,
              })}>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 15,
                  color: '#1B1B1B',
                  letterSpacing: -1.2,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                Reschedule
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
