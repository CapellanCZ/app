import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';

const ICON_WELL = 'rgba(41, 112, 255, 0.12)';
const ICON_COLOR = SCHEDULE_PARTNER.brand;
const RIPPLE = 'rgba(41, 112, 255, 0.12)';

const PRESS_SPRING = { damping: 20, stiffness: 420, mass: 0.32 } as const;
const PRESS_SCALE = 0.97;
const PRESS_OPACITY = 0.94;

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
 * Compact quick-action tile: one brand accent, white surface, light border and shadow.
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
        android_ripple={{ color: RIPPLE, foreground: true }}
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
          className="w-full min-h-[92px] items-center justify-center rounded-xl px-2 py-2.5"
          style={[
            pressVisualStyle,
            {
              backgroundColor: SCHEDULE_PARTNER.surface,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
            },
          ]}>
          <View
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: ICON_WELL }}>
            <Icon color={ICON_COLOR} size={22} />
          </View>
          <Text
            className="mt-1.5 px-0.5 text-center text-xs font-semibold leading-[15px] tracking-[-0.05px]"
            style={{ color: SCHEDULE_PARTNER.textPrimary }}
            numberOfLines={2}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}
