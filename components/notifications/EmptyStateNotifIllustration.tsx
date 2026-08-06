import { Image, View } from 'react-native';

type Props = {
  size?: number;
};

/** Figma empty-state bell (node 2255:1164) — `assets/images/notifications/empty-bell.png`. */
export function EmptyStateNotifIllustration({ size = 186 }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('@/assets/images/notifications/empty-bell.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="No notifications"
      />
    </View>
  );
}
