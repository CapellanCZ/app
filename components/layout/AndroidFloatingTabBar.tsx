import type { ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { IconsaxHomeTabIcon } from '@/components/icons/IconsaxHomeTabIcon';
import { IconsaxProfileTabIcon } from '@/components/icons/IconsaxProfileTabIcon';
import {
  ANDROID_TAB_BAR_HEIGHT,
  ANDROID_TAB_FLOAT_GAP,
} from '@/components/layout/BottomTabBar';
import { openDefaultBooking } from '@/lib/health-service/openDefaultBooking';
import { Inter } from '@/lib/typography/inter';
import { BRAND } from '@/lib/ui/theme';

const ACTIVE = BRAND.primary;
const INACTIVE = '#9CA3AF';
const ACTIVE_PILL_BG = '#EFEFEF';
const PRESS_IN = { damping: 18, stiffness: 420, mass: 0.35 } as const;
const PRESS_OUT = { damping: 16, stiffness: 280, mass: 0.4 } as const;

const DOCK_ELEVATION =
  Platform.OS === 'android'
    ? { elevation: 0, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      };

function PlusIcon({ color = ACTIVE, size = 22 }: { color?: string; size?: number }) {
  const stroke = Math.max(2, size * 0.09);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type TabItemProps = {
  label: string;
  focused: boolean;
  onPress: () => void;
  children: ReactNode;
};

function FloatingTabItem({ label, focused, onPress, children }: TabItemProps) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.get() * 0.06 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        pressed.set(withSpring(1, PRESS_IN));
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        pressed.set(withSpring(0, PRESS_OUT));
      }}
      hitSlop={6}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            minWidth: 72,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            backgroundColor: focused ? ACTIVE_PILL_BG : 'transparent',
          },
          animStyle,
        ]}>
        {children}
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 11,
            color: focused ? ACTIVE : INACTIVE,
            letterSpacing: -0.2,
          }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating center navigation — white pill dock with active gray highlight.
 * Home · Book · Profile (Book opens booking without staying on the book route).
 */
export function AndroidFloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, ANDROID_TAB_FLOAT_GAP);

  const routes = state.routes;
  const home = routes.find((r) => r.name === 'index');
  const profile = routes.find((r) => r.name === 'profiles');

  const focusedName = routes[state.index]?.name;
  const homeFocused = focusedName === 'index';
  const profileFocused = focusedName === 'profiles';
  const bookFocused = focusedName === 'book';

  const go = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 28,
        paddingBottom: bottomPad,
      }}>
      <View
        style={{
          height: ANDROID_TAB_BAR_HEIGHT,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#ECECEC',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          paddingHorizontal: 6,
          ...DOCK_ELEVATION,
        }}>
        <FloatingTabItem
          label="Home"
          focused={homeFocused}
          onPress={() => home && go('index', home.key, homeFocused)}>
          <IconsaxHomeTabIcon focused={homeFocused} size={22} />
        </FloatingTabItem>

        <FloatingTabItem
          label="Book"
          focused={bookFocused}
          onPress={() => void openDefaultBooking()}>
          <PlusIcon color={bookFocused ? ACTIVE : INACTIVE} size={22} />
        </FloatingTabItem>

        <FloatingTabItem
          label="Profile"
          focused={profileFocused}
          onPress={() => profile && go('profiles', profile.key, profileFocused)}>
          <IconsaxProfileTabIcon focused={profileFocused} size={22} />
        </FloatingTabItem>
      </View>
    </View>
  );
}
