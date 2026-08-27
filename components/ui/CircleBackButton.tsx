import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { BookingChevronIcon } from '@/components/booking/BookingIcons';
import { androidPressProps } from '@/lib/ui/androidPress';

type Props = {
  onPress: () => void;
  /** Extra style on the outer pressable (e.g. margin). */
  style?: StyleProp<ViewStyle>;
};

/**
 * White circular back control — same as book-appointment hero (Figma 2235:1586).
 * Visual size matches iOS; Android expands the hit area via hitSlop.
 */
export function CircleBackButton({ onPress, style }: Props) {
  const size = 42;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      {...androidPressProps({ borderless: true, hitSlop: Platform.OS === 'android' ? 10 : 6 })}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          elevation: 0,
        },
        style,
      ]}>
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <BookingChevronIcon size={24} color="#6C6C6C" />
      </View>
    </Pressable>
  );
}
