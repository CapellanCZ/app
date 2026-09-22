import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

const DOT = 7;
const PILL_W = 22;
const GAP = 6;
const ACTIVE = '#3F3F46';
const INACTIVE = '#D4D4D8';

type Props = {
  count: number;
  /** Horizontal scroll offset in px (page width × index). */
  scrollX: SharedValue<number>;
  pageWidth: number;
};

function PagerDot({
  index,
  scrollX,
  pageWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}) {
  const style = useAnimatedStyle(() => {
    if (pageWidth <= 0) {
      return {
        width: index === 0 ? PILL_W : DOT,
        backgroundColor: index === 0 ? ACTIVE : INACTIVE,
      };
    }

    const input = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];

    return {
      width: interpolate(scrollX.get(), input, [DOT, PILL_W, DOT], Extrapolation.CLAMP),
      backgroundColor: ACTIVE,
      opacity: interpolate(scrollX.get(), input, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

/**
 * Onboarding pager: inactive = soft circles, active = dark pill.
 * Width/opacity track scroll so the morph stays in sync with the finger.
 */
export function GetStartedPagerDots({ count, scrollX, pageWidth }: Props) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Page indicator, ${count} slides`}>
      {Array.from({ length: count }, (_, i) => (
        <PagerDot key={i} index={i} scrollX={scrollX} pageWidth={pageWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
    height: DOT + 4,
  },
  dot: {
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: INACTIVE,
  },
});
