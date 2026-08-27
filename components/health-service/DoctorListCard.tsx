import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { fadeSlideUpEntering, fadeSlideUpExiting } from '@/lib/animations/fadeSlideUp';
import type { StaffPresenceStatus } from '@/lib/health-service/healthServiceApi';
import type { Staff, StaffRole } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const AVATAR_BG = '#F5D0CE';
const AVAILABLE = '#62D300';
const WARNING = '#F5C518';
const UNAVAILABLE = '#D1D2D1';

const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;

/** Display name only — strip credentials (MD, DMD, …); keep Dr. for clinicians. */
function formatDoctorName(name: string, role: StaffRole): string {
  const cleaned = name
    .replace(/^Dr\.?\s*/i, '')
    .replace(/,?\s*\b(MD|DMD|DDS|DDM|DO|DPM|PhD|RN|NP|PA-?C?)\b\.?/gi, '')
    .replace(/\s*,\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!cleaned) return 'CampusCare Provider';
  if (role === 'doctor' || role === 'dentist') {
    return `Dr. ${cleaned}`;
  }
  return cleaned;
}

function specialtyLabel(role: StaffRole, fallback: string): string {
  if (role === 'doctor') return 'Physician';
  if (role === 'dentist') return 'Dentist';
  return fallback || 'Clinic Staff';
}

function statusMeta(status: StaffPresenceStatus): {
  label: string;
  color: string;
  glow: boolean;
} {
  switch (status) {
    case 'available':
      return { label: 'Available', color: AVAILABLE, glow: true };
    case 'on_break':
      return { label: 'On-break', color: WARNING, glow: true };
    case 'cutoff':
      return { label: 'Cutoff Status', color: WARNING, glow: true };
    case 'unavailable':
    default:
      return { label: 'Not Available', color: UNAVAILABLE, glow: false };
  }
}

type Props = {
  staff: Staff;
  status: StaffPresenceStatus;
  onPress: () => void;
  /** List index for staggered enter; omit to skip enter animation. */
  enterIndex?: number;
};

/**
 * School Doctors list row — Figma node 2243:347.
 */
export function DoctorListCard({ staff, status, onPress, enterIndex }: Props) {
  const name = formatDoctorName(staff.name, staff.role);
  const specialty = specialtyLabel(staff.role, staff.specialtyLabel);
  const initial = name.replace(/^Dr\.\s*/i, '').trim().charAt(0).toUpperCase() || '?';
  const meta = statusMeta(status);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${specialty}. ${meta.label}. Tap to book.`}
      onPress={onPress}
      {...androidPressProps({ hitSlop: 2 })}
      onPressIn={() => {
        if (reduceMotion) return;
        scale.value = withSpring(0.97, PRESS_SPRING);
        dim.value = withSpring(0.92, PRESS_SPRING);
      }}
      onPressOut={() => {
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
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#FFFFFF',
              paddingTop: 18,
              paddingBottom: 12,
              paddingHorizontal: 16,
            },
            pressStyle,
          ]}>
        <View style={{ gap: 8 }}>
          {/* Top: avatar · name · chevron */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#F0F0F0',
            }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: 'hidden',
                  backgroundColor: AVATAR_BG,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                {staff.photoUrl ? (
                  <Image
                    source={{ uri: staff.photoUrl }}
                    style={{ width: 44, height: 44 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontFamily: Inter.medium, fontSize: 16, color: '#8B5A5A' }}>
                    {initial}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 16,
                    color: '#000000',
                    letterSpacing: -0.64,
                  }}>
                  {name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 14,
                    color: '#3F3F3F',
                    letterSpacing: -1.12,
                  }}>
                  {specialty}
                </Text>
              </View>
            </View>

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
              <IconsaxArrowRightIcon size={22} color="#C0C0C0" />
            </View>
          </View>

          {/* Bottom: availability */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              minHeight: 24,
            }}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: meta.color,
                  shadowColor: meta.glow ? meta.color : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: meta.glow ? 0.35 : 0,
                  shadowRadius: 7.3,
                  elevation: meta.glow ? 2 : 0,
                }}
              />
            </View>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 14,
                color: status === 'on_break' || status === 'cutoff' ? '#B8860B' : '#3F3F3F',
                letterSpacing: -1.12,
              }}>
              {meta.label}
            </Text>
          </View>
        </View>
      </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
