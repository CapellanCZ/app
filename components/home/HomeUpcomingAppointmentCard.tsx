import { Image, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxCallFilledIcon } from '@/components/icons/IconsaxCallFilledIcon';
import { IconsaxTimerIcon } from '@/components/icons/IconsaxTimerIcon';
import { StaffPresenceDot } from '@/components/ui/StaffPresenceDot';
import type { DoctorPresenceDotStatus } from '@/lib/health-service/staffPresenceDot';
import { Inter } from '@/lib/typography/inter';
import { ANDROID_MIN_TOUCH, androidPressProps } from '@/lib/ui/androidPress';

const CARD_BG = '#D3E9FA';
const MUTED = '#3F3F3F';

export type HomeUpcomingAppointmentCardProps = {
  doctorName: string;
  specialtyLabel: string;
  photoUrl?: string | null;
  dateLabel: string;
  /** Appointment start, e.g. "10:00 AM" */
  timeLabel: string;
  /** Estimated finish time, e.g. "10:20 AM" — shown as EST */
  estDoneLabel?: string | null;
  /** Live staff presence for the avatar status circle. */
  presenceStatus?: DoctorPresenceDotStatus;
  onPress?: () => void;
  onCallPress?: () => void;
};

/**
 * Figma light-blue upcoming appointment card with floating badge.
 */
export function HomeUpcomingAppointmentCard({
  doctorName,
  specialtyLabel,
  photoUrl,
  dateLabel,
  timeLabel,
  estDoneLabel,
  presenceStatus,
  onPress,
  onCallPress,
}: HomeUpcomingAppointmentCardProps) {
  const timeAccessibility = estDoneLabel
    ? `${timeLabel}, estimated done ${estDoneLabel}`
    : timeLabel;
  return (
    <View style={{ width: '100%', paddingTop: 7 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: '4%',
          zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderWidth: 1,
          borderColor: '#FFFFFF',
          borderRadius: 19,
          paddingHorizontal: 10,
          paddingVertical: 3,
        }}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#666666',
            letterSpacing: -0.8,
            textTransform: 'uppercase',
          }}>
          Upcoming Appointments
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Upcoming appointment with ${doctorName}, ${dateLabel}, ${timeAccessibility}`}
        onPress={onPress}
        {...androidPressProps({ hitSlop: 2 })}
        style={({ pressed }) => ({
          backgroundColor: CARD_BG,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#FFFFFF',
          paddingTop: 18,
          paddingBottom: 12,
          paddingHorizontal: 16,
          overflow: 'hidden',
          opacity: pressed ? 0.92 : 1,
        })}>
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
              <View style={{ width: 44, height: 44, flexShrink: 0 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={22} color="#A4A7AE" />
                  )}
                </View>
                {/* Keep fully inside the 44×44 box — Android clips anything outside. */}
                <StaffPresenceDot
                  status={presenceStatus ?? 'offline'}
                  size={12}
                  style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 2 }}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 18,
                    color: '#000000',
                    letterSpacing: -0.64,
                  }}>
                  {doctorName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 16,
                    color: MUTED,
                    letterSpacing: -1.12,
                  }}>
                  {specialtyLabel}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Contact clinic"
              onPress={() => onCallPress?.()}
              {...androidPressProps({ borderless: true, hitSlop: 8 })}
              style={({ pressed }) => ({
                width: Platform.OS === 'android' ? ANDROID_MIN_TOUCH : 42,
                height: Platform.OS === 'android' ? ANDROID_MIN_TOUCH : 42,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.51)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                opacity: pressed ? 0.85 : 1,
              })}>
              <IconsaxCallFilledIcon size={16} color="#1F2024" />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 24,
              paddingHorizontal: 4,
              paddingTop: 4,
              minHeight: 36,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <IconsaxCalendarIcon size={18} color={MUTED} />
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 16,
                  color: MUTED,
                  letterSpacing: -1.12,
                }}>
                {dateLabel}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <IconsaxTimerIcon size={18} color={MUTED} />
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 16,
                  color: MUTED,
                  letterSpacing: -1.12,
                }}
                numberOfLines={1}>
                {estDoneLabel ? `${timeLabel} · EST ${estDoneLabel}` : timeLabel}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function HomeUpcomingEmptyCard() {
  return (
    <View style={{ width: '100%', paddingTop: 7 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: '4%',
          zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderWidth: 1,
          borderColor: '#FFFFFF',
          borderRadius: 19,
          paddingHorizontal: 10,
          paddingVertical: 3,
        }}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#666666',
            letterSpacing: -0.8,
            textTransform: 'uppercase',
          }}>
          Upcoming Appointments
        </Text>
      </View>
      <View
        style={{
          backgroundColor: CARD_BG,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#FFFFFF',
          paddingVertical: 28,
          paddingHorizontal: 16,
          alignItems: 'center',
          gap: 4,
        }}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 16,
            color: '#717680',
            letterSpacing: -0.32,
            textAlign: 'center',
          }}>
          No upcoming appointments
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#A4A7AE',
            letterSpacing: -0.24,
            textAlign: 'center',
          }}>
          Book a visit when you need the campus clinic
        </Text>
      </View>
    </View>
  );
}
