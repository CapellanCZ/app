import { Image, View } from 'react-native';

type Props = {
  size?: number;
};

/** Empty-state ringing bell — `assets/bell-alert.png`. */
export function EmptyStateNotifIllustration({ size = 186 }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('@/assets/bell-alert.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="No notifications"
      />
    </View>
  );
}
