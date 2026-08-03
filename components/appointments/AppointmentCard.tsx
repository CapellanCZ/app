import { Image, Linking, Pressable, Text, View } from 'react-native';

import {
  FigmaAppointmentCalendarIcon,
  FigmaAppointmentCallIcon,
  FigmaAppointmentClockIcon,
} from '@/components/appointments/FigmaAppointmentIcons';
import { Inter } from '@/lib/typography/inter';

/** Pastel card fills from Figma 2229:518 / 1464 / 1510 — cycle by list index. */
export const APPOINTMENT_CARD_COLORS = ['#D3E9FA', '#F4EDD6', '#F4E2FC'] as const;

type Props = {
  staffName: string;
  staffSpecialty?: string;
  staffPhoto?: string | null;
  /** e.g. "24 Feb, Thu" */
  dateLabel: string;
  /** e.g. "10:00 - 10:15" */
  timeLabel: string;
  /** Pastel background — pass from APPOINTMENT_CARD_COLORS[index % 3]. */
  backgroundColor: string;
  phoneNumber?: string | null;
  /** Show Cancel Appointment (pending / confirmed). */
  showCancel?: boolean;
  cancelDisabled?: boolean;
  onCancel?: () => void;
  /** Omit for cancelled rows — card is not tappable. */
  onPress?: () => void;
};

/**
 * Figma appointment list card (node 2229:518): pastel surface, doctor row, call, date/time, cancel.
 */
export function AppointmentCard({
  staffName,
  staffSpecialty = 'Physician',
  staffPhoto,
  dateLabel,
  timeLabel,
  backgroundColor,
  phoneNumber,
  showCancel = false,
  cancelDisabled = false,
  onCancel,
  onPress,
}: Props) {
  const initial = staffName.trim().charAt(0).toUpperCase() || '?';

  const onCall = () => {
    const digits = phoneNumber?.replace(/[^\d+]/g, '');
    if (!digits) return;
    void Linking.openURL(`tel:${digits}`);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${staffName}, ${dateLabel}, ${timeLabel}`}
      disabled={!onPress}
      onPress={onPress}
      style={{
        backgroundColor,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 16,
        paddingTop: 18,
        paddingBottom: 12,
        paddingHorizontal: 16,
        width: '100%',
        gap: 10,
      }}
      className="active:opacity-90">
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
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
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 18,
                  color: '#000000',
                  letterSpacing: -0.64,
                  lineHeight: 20,
                }}>
                {staffName}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 16,
                  color: '#3F3F3F',
                  letterSpacing: -1.12,
                  lineHeight: 18,
                }}>
                {staffSpecialty}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={phoneNumber ? `Call ${staffName}` : 'Call unavailable'}
            disabled={!phoneNumber}
            onPress={onCall}
            hitSlop={8}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.51)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: phoneNumber ? 1 : 0.55,
            }}>
            <FigmaAppointmentCallIcon size={19} color="#6C6C6C" />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24,
            paddingHorizontal: 10,
            minHeight: 28,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <FigmaAppointmentCalendarIcon size={20} color="#3F3F3F" />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Inter.regular,
                fontSize: 16,
                color: '#3F3F3F',
                letterSpacing: -1.12,
              }}>
              {dateLabel}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <FigmaAppointmentClockIcon size={20} color="#3F3F3F" />
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 16,
                color: '#3F3F3F',
                letterSpacing: -1.12,
              }}>
              {timeLabel}
            </Text>
          </View>
        </View>
      </View>

      {showCancel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel appointment"
          disabled={cancelDisabled}
          onPress={onCancel}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.83)',
            borderWidth: 1,
            borderColor: '#E3E3E3',
            borderRadius: 16,
            paddingVertical: 8,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: cancelDisabled ? 0.5 : 1,
          }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 17,
              color: '#1B1B1B',
              letterSpacing: -1.2,
              textAlign: 'center',
              lineHeight: 20,
            }}>
            Cancel Appointment
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
