import { Pressable, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GreyAvatar } from '@/components/profile/GreyAvatar';

type UserInfoCardProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
  onAvatarPress: () => void;
};

/**
 * User info card with avatar, name, email, and blue glow.
 */
export function UserInfoCard({
  name,
  email,
  avatarUrl,
  onAvatarPress,
}: UserInfoCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 12,
        marginBottom: 24,
        gap: 12,
        overflow: 'hidden',
      }}>
      {/* Blue glow — top right */}
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
              <Stop offset="0%" stopColor="#2970FF" stopOpacity={0.35} />
              <Stop offset="50%" stopColor="#2970FF" stopOpacity={0.08} />
              <Stop offset="100%" stopColor="#2970FF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="whiteSpot"
              cx="100%"
              cy="0%"
              r="45%"
              fx="100%"
              fy="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity={0.5} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="200" height="200" fill="url(#blueGlow)" />
          <Rect x="0" y="0" width="200" height="200" fill="url(#whiteSpot)" />
        </Svg>
      </View>

      {/* Avatar + Name row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={onAvatarPress}>
          <GreyAvatar size={52} name={name} avatarUrl={avatarUrl} />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 20,
              fontWeight: '500',
              color: '#000',
              letterSpacing: -0.8,
            }}>
            {name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: '#717680',
              letterSpacing: -0.2,
            }}>
            {email}
          </Text>
        </View>
      </View>
    </View>
  );
}
