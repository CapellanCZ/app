import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxCallFilledIcon } from '@/components/icons/IconsaxCallFilledIcon';
import { IconsaxTimerIcon } from '@/components/icons/IconsaxTimerIcon';
import { Inter } from '@/lib/typography/inter';

const CARD_BG = '#D3E9FA';
const MUTED = '#3F3F3F';

export type HomeUpcomingAppointmentCardProps = {
  doctorName: string;
  specialtyLabel: string;
  photoUrl?: string | null;
  dateLabel: string;
  timeLabel: string;
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
  onPress,
  onCallPress,
}: HomeUpcomingAppointmentCardProps) {
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
            fontSize: 10,
            color: '#666666',
            letterSpacing: -0.8,
            textTransform: 'uppercase',
          }}>
          Upcoming Appointments
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Upcoming appointment with ${doctorName}, ${dateLabel}, ${timeLabel}`}
        onPress={onPress}
        style={{
          backgroundColor: CARD_BG,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#FFFFFF',
          paddingTop: 18,
          paddingBottom: 12,
          paddingHorizontal: 16,
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
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={22} color="#A4A7AE" />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 16,
                    color: '#000000',
                    letterSpacing: -0.64,
                  }}>
                  {doctorName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 14,
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
              hitSlop={8}
              onPress={() => onCallPress?.()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.51)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
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
                  fontSize: 14,
                  color: MUTED,
                  letterSpacing: -1.12,
                }}>
                {dateLabel}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <IconsaxTimerIcon size={18} color={MUTED} />
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 14,
                  color: MUTED,
                  letterSpacing: -1.12,
                }}>
                {timeLabel}
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
            fontSize: 10,
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
