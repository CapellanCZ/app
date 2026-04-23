import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  /** Value from 0 to 1 */
  value: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
};

/** Animated horizontal progress bar. */
export function ProgressBar({
  value,
  height = 7,
  trackColor = '#FAFAFA',
  fillColor = '#2970FF',
}: Props) {
  const anim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, value]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
