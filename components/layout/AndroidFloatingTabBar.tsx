import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
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
  ANDROID_TAB_FAB_OVERHANG,
} from '@/components/layout/BottomTabBar';
import { openDefaultBooking } from '@/lib/health-service/openDefaultBooking';
import { Inter } from '@/lib/typography/inter';

const FAB_SIZE = 56;
/** Clear gap between the FAB edge and the circular cutout. */
const FAB_GAP = 12;
/** Circular notch radius = button radius + breathing room. */
const NOTCH_RADIUS = FAB_SIZE / 2 + FAB_GAP;
/** Softens only the sharp lip where the flat top meets the cutout. */
const LIP_R = 11;
/** Soft sky blue — matches home “Upcoming Appointments” card (`#D3E9FA`). */
const SOFT_BLUE = '#D3E9FA';
/** Readable soft blue for active Home / Profile. */
const ACTIVE = '#6BAED6';
const INACTIVE = '#B0B3B8';
/** Plus mark on the light FAB — mid soft blue (between dark navy and white). */
const FAB_ICON = '#5A9BC4';
const PRESS_IN = { damping: 18, stiffness: 420, mass: 0.35 } as const;
const PRESS_OUT = { damping: 16, stiffness: 280, mass: 0.4 } as const;

function PlusIcon({ color = '#FFFFFF', size = 28 }: { color?: string; size?: number }) {
  const stroke = Math.max(2, size * 0.075);
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

/**
 * Dock silhouette: flat outer edges + circular FAB cutout with smooth lips only.
 */
function buildDockPath(width: number, height: number, cx: number): string {
  const r = NOTCH_RADIUS;
  const lip = LIP_R;

  return [
    `M0,0`,
    `H${cx - r - lip}`,
    // Left lip — rounds the sharp join into the cutout
    `A${lip} ${lip} 0 0 1 ${cx - r},${lip}`,
    // Main circular cutout
    `A${r} ${r} 0 0 0 ${cx + r},${lip}`,
    // Right lip
    `A${lip} ${lip} 0 0 1 ${cx + r + lip},0`,
    `H${width}`,
    `V${height}`,
    `H0`,
    `Z`,
  ].join(' ');
}

/**
 * Android floating tab bar — white bar with smooth center notch + blue FAB (+).
 * Matches the common cutout dock pattern (Home · Book · Profile).
 */
export function AndroidFloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bottomPad = Math.max(insets.bottom, 8);
  const barHeight = ANDROID_TAB_BAR_HEIGHT + bottomPad;
  const totalHeight = barHeight + ANDROID_TAB_FAB_OVERHANG;

  const cx = width / 2;
  const notchPath = buildDockPath(width, barHeight, cx);

  const routes = state.routes;
  const home = routes.find((r) => r.name === 'index');
  const profile = routes.find((r) => r.name === 'profiles');

  const focusedName = routes[state.index]?.name;
  const homeFocused = focusedName === 'index';
  const profileFocused = focusedName === 'profiles';

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

  const fabPressed = useSharedValue(0);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - fabPressed.get() * 0.1 }],
  }));

  const onFabPressIn = () => {
    fabPressed.set(withSpring(1, PRESS_IN));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onFabPressOut = () => {
    fabPressed.set(withSpring(0, PRESS_OUT));
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: totalHeight,
      }}>
      {/* White dock with smooth cutout */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: barHeight,
        }}>
        <Svg
          width={width}
          height={barHeight}
          pointerEvents="none"
          style={{ position: 'absolute' }}>
          <Path
            d={notchPath}
            fill="#FFFFFF"
            stroke="#E5E5E5"
            strokeWidth={1}
          />
        </Svg>

        {/* Side tabs */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'stretch',
            paddingTop: 6,
            paddingBottom: Math.max(bottomPad - 4, 4),
            paddingHorizontal: 8,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: homeFocused }}
            accessibilityLabel={descriptors[home?.key ?? '']?.options.title ?? 'Home'}
            onPress={() => home && go('index', home.key, homeFocused)}
            hitSlop={8}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: pressed ? 0.85 : 1,
            })}
            android_ripple={{ color: 'rgba(107,174,214,0.18)', borderless: true, radius: 36 }}>
            <IconsaxHomeTabIcon focused={homeFocused} size={24} />
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 12,
                color: homeFocused ? ACTIVE : INACTIVE,
                letterSpacing: -0.2,
              }}>
              Home
            </Text>
          </Pressable>

          {/* Spacer matches circular cutout + lips */}
          <View style={{ width: (NOTCH_RADIUS + LIP_R) * 2 + 8 }} pointerEvents="none" />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: profileFocused }}
            accessibilityLabel={descriptors[profile?.key ?? '']?.options.title ?? 'Profile'}
            onPress={() => profile && go('profiles', profile.key, profileFocused)}
            hitSlop={8}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: pressed ? 0.85 : 1,
            })}
            android_ripple={{ color: 'rgba(107,174,214,0.18)', borderless: true, radius: 36 }}>
            <IconsaxProfileTabIcon focused={profileFocused} size={24} />
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 12,
                color: profileFocused ? ACTIVE : INACTIVE,
                letterSpacing: -0.2,
              }}>
              Profile
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Center floating + — sits slightly below the bar top inside the cutout */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ANDROID_TAB_FAB_OVERHANG - FAB_SIZE / 2 + 8,
          alignItems: 'center',
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Book"
          onPress={() => void openDefaultBooking()}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          hitSlop={14}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: FAB_SIZE,
            height: FAB_SIZE,
          }}>
          <Animated.View
            style={[
              {
                width: FAB_SIZE,
                height: FAB_SIZE,
                borderRadius: FAB_SIZE / 2,
                backgroundColor: SOFT_BLUE,
                alignItems: 'center',
                justifyContent: 'center',
              },
              fabStyle,
            ]}>
            <PlusIcon color={FAB_ICON} size={28} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}
