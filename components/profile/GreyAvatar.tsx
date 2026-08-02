import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Inter } from '@/lib/typography/inter';

export const GREY_AVATAR_BG = '#E5E7EB';
export const GREY_AVATAR_FG = '#6B7280';

type Props = {
  size: number;
  name?: string;
  avatarUrl?: string | null;
  style?: StyleProp<ViewStyle>;
};

/**
 * Grey circular profile avatar — photo when set, otherwise initial on grey.
 */
export function GreyAvatar({ size, name = '', avatarUrl, style }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const fontSize = Math.round(size * 0.4);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: GREY_AVATAR_BG,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize,
            color: GREY_AVATAR_FG,
            lineHeight: fontSize + 2,
          }}>
          {initial}
        </Text>
      )}
    </View>
  );
}
