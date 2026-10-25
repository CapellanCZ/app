import { Pressable, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { GreyAvatar } from '@/components/profile/GreyAvatar';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { CARD_ELEVATION } from '@/lib/ui/theme';

type UserInfoCardProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
  /** Name / email / chevron — opens Edit Profile. */
  onPress: () => void;
  /** Avatar only — opens full-screen photo preview when a photo exists. */
  onViewAvatar?: () => void;
};

/**
 * User info card — sibling press targets (not nested) so web never mounts
 * `<button>` inside `<button>`.
 */
export function UserInfoCard({
  name,
  email,
  avatarUrl,
  onPress,
  onViewAvatar,
}: UserInfoCardProps) {
  const canViewAvatar = Boolean(avatarUrl && onViewAvatar);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ECECEC',
        paddingHorizontal: 16,
        paddingVertical: 16,
        overflow: 'hidden',
        ...CARD_ELEVATION,
      }}>
      {/* Soft blue glow — same family as Upcoming Appointments */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 200,
          height: 200,
        }}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient
              id="blueGlow"
              cx="100%"
              cy="0%"
              r="100%"
              fx="100%"
              fy="0%">
              <Stop offset="0%" stopColor="#E8F0FF" stopOpacity={0.95} />
              <Stop offset="45%" stopColor="#E8F0FF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#E8F0FF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="200" height="200" fill="url(#blueGlow)" />
        </Svg>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {canViewAvatar ? (
          <Pressable
            onPress={() => onViewAvatar?.()}
            accessibilityRole="button"
            accessibilityLabel="View profile photo"
            {...androidPressProps({ borderless: true, hitSlop: 8 })}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <GreyAvatar size={52} name={name} avatarUrl={avatarUrl} />
          </Pressable>
        ) : (
          <GreyAvatar size={52} name={name} avatarUrl={avatarUrl} />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit profile, ${name}`}
          onPress={onPress}
          {...androidPressProps({ hitSlop: 2 })}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.92 : 1,
          })}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Inter.medium,
                fontSize: 18,
                letterSpacing: -0.8,
                lineHeight: 24,
                color: '#222222',
              }}>
              {name}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Inter.regular,
                fontSize: 14,
                letterSpacing: -0.28,
                lineHeight: 20,
                color: '#727272',
              }}>
              {email}
            </Text>
          </View>
          <IconsaxArrowRightIcon size={20} color="#A7A7A7" />
        </Pressable>
      </View>
    </View>
  );
}
