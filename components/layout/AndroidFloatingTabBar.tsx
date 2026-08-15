import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { IconsaxHomeTabIcon } from '@/components/icons/IconsaxHomeTabIcon';
import { IconsaxProfileTabIcon } from '@/components/icons/IconsaxProfileTabIcon';
import {
  ANDROID_TAB_BAR_HEIGHT,
  ANDROID_TAB_FAB_OVERHANG,
} from '@/components/layout/BottomTabBar';
import { Inter } from '@/lib/typography/inter';

const FAB_SIZE = 56;
const NOTCH_RADIUS = 38;
const ACTIVE = '#2970FF';
const INACTIVE = '#B0B3B8';

function PlusIcon({ color = '#FFFFFF', size = 28 }: { color?: string; size?: number }) {
  const stroke = Math.max(2.5, size * 0.1);
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
 * Android floating tab bar — white bar with center notch + blue FAB (+).
 * Matches the common cutout dock pattern (Home · Book · Profile).
 */
export function AndroidFloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bottomPad = Math.max(insets.bottom, 8);
  const barHeight = ANDROID_TAB_BAR_HEIGHT + bottomPad;
  const totalHeight = barHeight + ANDROID_TAB_FAB_OVERHANG;

  const cx = width / 2;
  const nr = NOTCH_RADIUS;
  // Circular concave notch along the top edge (reference dock shape).
  const notchPath = `
    M0 0
    H${cx - nr}
    A${nr} ${nr} 0 0 0 ${cx + nr} 0
    H${width}
    V${barHeight}
    H0
    Z
  `;

  const routes = state.routes;
  const home = routes.find((r) => r.name === 'index');
  const book = routes.find((r) => r.name === 'book');
  const profile = routes.find((r) => r.name === 'profiles');

  const focusedName = routes[state.index]?.name;
  const homeFocused = focusedName === 'index';
  const bookFocused = focusedName === 'book';
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
      {/* White dock with center cutout */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: barHeight,
        }}>
        <Svg width={width} height={barHeight} style={{ position: 'absolute' }}>
          <Path
            d={notchPath}
            fill="#FFFFFF"
            // Soft elevation via duplicate offset path isn't needed — use RN shadow on wrapper.
          />
        </Svg>
        {/* Shadow layer behind SVG (Android elevation needs opaque view) */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            elevation: 16,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
          }}
        />

        {/* Side tabs */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingTop: 10,
            paddingHorizontal: 8,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: homeFocused }}
            accessibilityLabel={descriptors[home?.key ?? '']?.options.title ?? 'Home'}
            onPress={() => home && go('index', home.key, homeFocused)}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 4 }}
            android_ripple={{ color: 'rgba(41,112,255,0.12)', borderless: true }}>
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

          {/* Spacer for FAB / notch */}
          <View style={{ width: NOTCH_RADIUS * 2 + 24 }} />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: profileFocused }}
            accessibilityLabel={descriptors[profile?.key ?? '']?.options.title ?? 'Profile'}
            onPress={() => profile && go('profiles', profile.key, profileFocused)}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 4 }}
            android_ripple={{ color: 'rgba(41,112,255,0.12)', borderless: true }}>
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

      {/* Center floating + */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          alignItems: 'center',
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: bookFocused }}
          accessibilityLabel="Book"
          onPress={() => book && go('book', book.key, bookFocused)}
          style={{ alignItems: 'center' }}
          android_ripple={{ color: 'rgba(41,112,255,0.12)', borderless: true, radius: 40 }}>
          <View
            style={{
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: FAB_SIZE / 2,
              backgroundColor: ACTIVE,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              shadowColor: ACTIVE,
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}>
            <PlusIcon color="#FFFFFF" size={28} />
          </View>
          <Text
            style={{
              marginTop: 4,
              fontFamily: Inter.medium,
              fontSize: 12,
              color: bookFocused ? ACTIVE : INACTIVE,
              letterSpacing: -0.2,
            }}>
            Book
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
