import { Image, View } from 'react-native';

type Props = {
  size?: number;
};

/** Empty-state 3D calendar — `assets/3d-calendar.png` (Figma 2286:429). */
export function EmptyStateAppointmentsIllustration({ size = 192 }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('@/assets/3d-calendar.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="No appointments"
      />
    </View>
  );
}
