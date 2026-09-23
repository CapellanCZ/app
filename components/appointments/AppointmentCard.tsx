import { Image, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  FigmaAppointmentCalendarIcon,
} from '@/components/appointments/FigmaAppointmentIcons';
import { BookingChevronIcon } from '@/components/booking/BookingIcons';
import { IconsaxCallFilledIcon } from '@/components/icons/IconsaxCallFilledIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import { IconsaxTickCircleIcon } from '@/components/icons/IconsaxTickCircleIcon';
import { fadeSlideUpEntering, fadeSlideUpExiting } from '@/lib/animations/fadeSlideUp';
import { openClinicCall } from '@/lib/health-service/clinicContact';
import type { AppointmentStatus } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;

/** Soft outline — white cards on #F9F9F9. */
const CARD_BORDER = '#E8E8E8';
const CARD_BG = '#FFFFFF';

/** Same blue / yellow / pink wells as notifications + home vitals. */
const STATUS_TAG: Partial<
  Record<
    AppointmentStatus,
    { bg: string; color: string; label: string; kind: 'clock' | 'check' }
  >
> = {
  pending: { bg: '#F4EDD6', color: '#7E6B28', label: 'Pending', kind: 'clock' },
  confirmed: { bg: '#D3E9FA', color: '#048AF3', label: 'Confirmed', kind: 'check' },
  cancelled: { bg: '#F4E2FC', color: '#7C52A2', label: 'Cancelled', kind: 'clock' },
};

export type AppointmentCardVariant = 'upcoming' | 'past' | 'cancelled';

export type AppointmentCardDetailRow = {
  label: string;
  value: string;
};

type Props = {
  variant: AppointmentCardVariant;
  staffName: string;
  staffSpecialty?: string;
  /** Line under the name on completed cards — e.g. "Consulted by". */
  subtitle?: string;
  staffPhoto?: string | null;
  /** Upcoming meta — e.g. "6 Aug, Thu, 9:20 PM". */
  dateLabel?: string;
  /** Upcoming only — drives the status chip next to the date. */
  status?: Extract<AppointmentStatus, 'pending' | 'confirmed'>;
  /** Completed / cancelled key-value rows (Figma). */
  detailRows?: AppointmentCardDetailRow[];
  phoneNumber?: string | null;
  onReschedule?: () => void;
  onPress?: () => void;
  enterIndex?: number;
};

function DetailRow({ label, value }: AppointmentCardDetailRow) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.detailValue} numberOfLines={4}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Appointment list card — white + light gray outline.
 * Upcoming keeps the prior icon meta layout; completed uses Figma KV rows.
 */
export function AppointmentCard({
  variant,
  staffName,
  staffSpecialty = 'Physician',
  subtitle,
  staffPhoto,
  dateLabel,
  status,
  detailRows = [],
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
  const showCall = variant === 'upcoming' || variant === 'cancelled';
  const showChevron = variant === 'past';
  const statusMeta = status ? STATUS_TAG[status] : undefined;
  const isUpcomingLayout = variant === 'upcoming';

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: dim.get(),
  }));

  const accessibilityBits = [
    staffName,
    dateLabel,
    statusMeta?.label,
    ...detailRows.map((r) => `${r.label} ${r.value}`),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${accessibilityBits}`}
      disabled={!canPress}
      onPress={onPress}
      {...androidPressProps({ hitSlop: 2 })}
      onPressIn={() => {
        if (!canPress || reduceMotion) return;
        scale.set(withSpring(0.97, PRESS_SPRING));
        dim.set(withSpring(0.92, PRESS_SPRING));
      }}
      onPressOut={() => {
        if (!canPress) return;
        scale.set(withSpring(1, PRESS_SPRING));
        dim.set(withSpring(1, PRESS_SPRING));
      }}>
      <Animated.View
        entering={
          enterIndex != null && !reduceMotion ? fadeSlideUpEntering(enterIndex) : undefined
        }
        exiting={reduceMotion ? undefined : fadeSlideUpExiting()}>
        <Animated.View
          style={[styles.card, isUpcomingLayout ? styles.cardUpcoming : null, pressStyle]}>
          {isUpcomingLayout ? (
            <>
              <View style={styles.upcomingHeader}>
                <View style={styles.upcomingHeaderLeft}>
                  <View style={styles.avatar}>
                    {staffPhoto ? (
                      <Image
                        source={{ uri: staffPhoto }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    )}
                  </View>
                  <View style={styles.headerText}>
                    <Text numberOfLines={1} style={styles.name}>
                      {staffName}
                    </Text>
                    <Text numberOfLines={1} style={styles.subtitle}>
                      {staffSpecialty}
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${staffName}`}
                  onPress={() => openClinicCall(phoneNumber)}
                  {...androidPressProps({ borderless: true, hitSlop: 8 })}
                  style={({ pressed }) => [
                    styles.callBtn,
                    pressed && { opacity: 0.85 },
                  ]}>
                  <IconsaxCallFilledIcon size={18} color="#6C6C6C" />
                </Pressable>
              </View>

              <View style={styles.upcomingMeta}>
                {dateLabel ? (
                  <View style={styles.metaChip}>
                    <FigmaAppointmentCalendarIcon size={20} color="#3F3F3F" />
                    <Text numberOfLines={1} style={styles.metaText}>
                      {dateLabel}
                    </Text>
                  </View>
                ) : null}

                {statusMeta ? (
                  <View
                    accessibilityRole="text"
                    accessibilityLabel={statusMeta.label}
                    style={[styles.statusTag, { backgroundColor: statusMeta.bg }]}>
                    {statusMeta.kind === 'clock' ? (
                      <IconsaxClockIcon size={14} color={statusMeta.color} />
                    ) : (
                      <IconsaxTickCircleIcon size={14} color={statusMeta.color} />
                    )}
                    <Text
                      numberOfLines={1}
                      style={[styles.statusTagText, { color: statusMeta.color }]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.avatar}>
                  {staffPhoto ? (
                    <Image
                      source={{ uri: staffPhoto }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  )}
                </View>

                <View style={styles.headerText}>
                  <Text numberOfLines={1} style={styles.name}>
                    {staffName}
                  </Text>
                  <Text numberOfLines={1} style={styles.subtitle}>
                    {subtitle ?? staffSpecialty}
                  </Text>
                </View>

                {showCall ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${staffName}`}
                    onPress={() => openClinicCall(phoneNumber)}
                    {...androidPressProps({ borderless: true, hitSlop: 8 })}
                    style={({ pressed }) => [
                      styles.headerAction,
                      pressed && { opacity: 0.85 },
                    ]}>
                    <IconsaxCallFilledIcon size={18} color="#6C6C6C" />
                  </Pressable>
                ) : null}

                {showChevron ? (
                  <View style={styles.headerAction} pointerEvents="none">
                    <BookingChevronIcon size={22} color="#6C6C6C" />
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.details}>
                {detailRows.map((row) => (
                  <DetailRow key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
                ))}
              </View>

              {variant === 'cancelled' && onReschedule ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule appointment"
                  onPress={onReschedule}
                  {...androidPressProps({ hitSlop: 2 })}
                  style={({ pressed }) => [styles.rescheduleBtn, pressed && { opacity: 0.88 }]}>
                  <Text style={styles.rescheduleLabel}>Reschedule</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 20,
  },
  cardUpcoming: {
    paddingTop: 18,
    paddingBottom: 12,
    gap: 10,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  upcomingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  upcomingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 20,
    rowGap: 10,
    paddingHorizontal: 10,
    paddingTop: 6,
    minHeight: 28,
    width: '100%',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  metaText: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#3F3F3F',
    letterSpacing: -1.12,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusTagText: {
    fontFamily: Inter.medium,
    fontSize: 12,
    letterSpacing: -0.24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarInitial: {
    fontFamily: Inter.medium,
    fontSize: 18,
    color: '#6B7280',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: Inter.regular,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.64,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#3F3F3F',
    letterSpacing: -1.12,
    lineHeight: 18,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E3E3E3',
    width: '100%',
  },
  details: {
    gap: 12,
    paddingHorizontal: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  detailLabel: {
    flex: 1,
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#6C6C6C',
    letterSpacing: -1.12,
    lineHeight: 18,
  },
  detailValue: {
    flex: 1,
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#000000',
    letterSpacing: -1.12,
    lineHeight: 18,
    textAlign: 'left',
  },
  rescheduleBtn: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleLabel: {
    fontFamily: Inter.regular,
    fontSize: 15,
    color: '#1B1B1B',
    letterSpacing: -1.2,
  },
});
