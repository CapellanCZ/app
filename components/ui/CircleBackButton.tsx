import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { BookingChevronIcon } from '@/components/booking/BookingIcons';
import { ANDROID_MIN_TOUCH, androidPressProps } from '@/lib/ui/androidPress';

type Props = {
  onPress: () => void;
  /** Extra style on the outer pressable (e.g. margin). */
  style?: StyleProp<ViewStyle>;
};

/**
 * White circular back control — same as book-appointment hero (Figma 2235:1586).
 */
export function CircleBackButton({ onPress, style }: Props) {
  const size = Platform.OS === 'android' ? ANDROID_MIN_TOUCH : 42;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      {...androidPressProps({ borderless: true, hitSlop: 10 })}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          // Opaque bg helps Android elevation/ripple clip correctly.
          elevation: Platform.OS === 'android' ? 2 : 0,
        },
        style,
      ]}>
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <BookingChevronIcon size={24} color="#6C6C6C" />
      </View>
    </Pressable>
  );
}
