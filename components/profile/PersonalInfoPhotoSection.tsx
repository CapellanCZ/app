import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { IconsaxEditIcon } from '@/components/icons/IconsaxEditIcon';
import { GreyAvatar } from '@/components/profile/GreyAvatar';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const AVATAR_SIZE = 104;
const BADGE_SIZE = 34;

type Props = {
  name: string;
  avatarUrl: string | null;
  uploading?: boolean;
  onPress: () => void;
};

/** Centered profile photo picker — matches profile tab glow and Inter hierarchy. */
export function PersonalInfoPhotoSection({
  name,
  avatarUrl,
  uploading = false,
  onPress,
}: Props) {
  const hasPhoto = Boolean(avatarUrl);
  const actionLabel = hasPhoto ? 'Change photo' : 'Add profile photo';

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 22,
        overflow: 'hidden',
        alignItems: 'center',
        gap: 16,
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 220,
          height: 220,
        }}>
        <Svg width={220} height={220} viewBox="0 0 220 220">
          <Defs>
            <RadialGradient id="photoSectionGlow" cx="100%" cy="0%" r="100%" fx="100%" fy="0%">
              <Stop offset="0%" stopColor="#D3E9FA" stopOpacity={0.95} />
              <Stop offset="45%" stopColor="#D3E9FA" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#D3E9FA" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="220" height="220" fill="url(#photoSectionGlow)" />
        </Svg>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityState={{ busy: uploading }}
        disabled={uploading}
        onPress={onPress}
        {...androidPressProps({ borderless: true, hitSlop: 8 })}
        style={({ pressed }) => ({
          opacity: pressed && !uploading ? 0.9 : 1,
        })}>
        <View style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
          <GreyAvatar
            size={AVATAR_SIZE}
            name={name}
            avatarUrl={avatarUrl}
            style={{
              borderWidth: 3,
              borderColor: '#FFFFFF',
            }}
          />

          {uploading ? (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: AVATAR_SIZE / 2,
                backgroundColor: 'rgba(255, 255, 255, 0.72)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ActivityIndicator size="small" color="#6BAED6" />
            </View>
          ) : (
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: BADGE_SIZE / 2,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#F9F9F9',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}>
              <IconsaxEditIcon size={16} color="#6BAED6" />
            </View>
          )}
        </View>
      </Pressable>

      <View style={{ alignItems: 'center', gap: 12, maxWidth: 280 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          disabled={uploading}
          onPress={onPress}
          {...androidPressProps({ hitSlop: 4 })}
          style={({ pressed }) => ({
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: '#D3E9FA',
            opacity: uploading ? 0.6 : pressed ? 0.88 : 1,
          })}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 15,
              color: '#4D7A9A',
              letterSpacing: -0.4,
              lineHeight: 20,
            }}>
            {uploading ? 'Uploading…' : actionLabel}
          </Text>
        </Pressable>

        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 13,
            color: 'rgba(114, 114, 114, 0.62)',
            letterSpacing: -0.2,
            lineHeight: 18,
            textAlign: 'center',
          }}>
          {hasPhoto
            ? 'Tap your photo or the button to choose a new one.'
            : 'Add a photo so clinic staff can recognize you at check-in.'}
        </Text>
      </View>
    </View>
  );
}
