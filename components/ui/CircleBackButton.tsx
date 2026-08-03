import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { BookingChevronIcon } from '@/components/booking/BookingIcons';

type Props = {
  onPress: () => void;
  /** Extra style on the outer pressable (e.g. margin). */
  style?: StyleProp<ViewStyle>;
};

/**
 * White circular back control — same as book-appointment hero (Figma 2235:1586).
 */
export function CircleBackButton({ onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      style={[
        {
          width: 42,
          height: 42,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      className="active:opacity-80">
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <BookingChevronIcon size={24} color="#6C6C6C" />
      </View>
    </Pressable>
  );
}
