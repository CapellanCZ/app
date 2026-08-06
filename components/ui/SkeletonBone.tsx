import { useEffect, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type BoneProps = {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

/** Soft pulse placeholder — not a spinner. Respects reduced motion. */
export function SkeletonBone({ width, height, borderRadius = 8, style }: BoneProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 0.55 : 0.35);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.55;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(0,0,0,0.08)',
        },
        animStyle,
        style,
      ]}
    />
  );
}

type ListProps = {
  count?: number;
  renderItem: (index: number) => ReactNode;
};

export function SkeletonList({ count = 4, renderItem }: ListProps) {
  return (
    <View style={{ gap: 12, width: '100%' }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={`skeleton-${i}`}>{renderItem(i)}</View>
      ))}
    </View>
  );
}
