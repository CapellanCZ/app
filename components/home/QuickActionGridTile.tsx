import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const ICON_WELL = '#EFF4FF';
const ICON_COLOR = '#2970FF';
const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;
const PRESS_SCALE = 0.96;
const PRESS_OPACITY = 0.92;

export type QuickActionIconProps = {
  size?: number;
  color?: string;
};

export type QuickActionGridTileProps = {
  label: string;
  Icon: ComponentType<QuickActionIconProps>;
  onPress?: () => void;
  className?: string;
};

/**
 * Square quick-action cell for a 2×2 grid: icon well + centered label.
 */
export function QuickActionGridTile({ label, Icon, onPress, className }: QuickActionGridTileProps) {
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const pressVisualStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  return (
    <View className={`min-w-0 flex-1 ${className ?? ''}`}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        className="w-full active:opacity-100"
        android_ripple={{ color: 'rgba(41,112,255,0.12)', foreground: true }}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(PRESS_SCALE, PRESS_SPRING);
          dim.value = withSpring(PRESS_OPACITY, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
          dim.value = withSpring(1, PRESS_SPRING);
        }}>
        <Animated.View
          className="w-full min-h-[112px] items-center justify-center rounded-2xl bg-[#FAFAFA] px-2 py-3"
          style={pressVisualStyle}>
          <View className="size-12 items-center justify-center rounded-2xl p-0.5" style={{ backgroundColor: ICON_WELL }}>
            <Icon color={ICON_COLOR} size={26} />
          </View>
          <Text
            className="mt-2 px-1 text-center text-xs font-semibold leading-4 text-[#181D27]"
            numberOfLines={2}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}
