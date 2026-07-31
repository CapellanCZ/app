import { router, usePathname } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon } from '@/components/icons/HomeIcon';
import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxProfileIcon } from '@/components/icons/IconsaxProfileIcon';

export const TAB_BAR_HEIGHT = 80;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function isHomePath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === '/health-service' || path === '/health-service/index';
}

function isAppointmentsPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return (
    path === '/health-service/appointments' ||
    path.startsWith('/health-service/appointment/') ||
    path === '/(tabs)/appointments'
  );
}

function isProfilePath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === '/(tabs)/profiles' || path.endsWith('/profiles');
}

function isTabBarVisible(pathname: string): boolean {
  return isHomePath(pathname) || isAppointmentsPath(pathname) || isProfilePath(pathname);
}

const ACTIVE_BG = '#2970FF';
const ICON_ACTIVE = '#FFFFFF';
const ICON_INACTIVE = '#9095A1';

type Tab = {
  key: string;
  route: string;
  match: (pathname: string) => boolean;
};

function TabIcon({ tabKey, focused }: { tabKey: string; focused: boolean }) {
  const color = focused ? ICON_ACTIVE : ICON_INACTIVE;
  const size = 22;

  if (tabKey === 'home') return <HomeIcon size={size} color={color} />;
  if (tabKey === 'appointments') return <IconsaxCalendarIcon size={size} color={color} />;
  if (tabKey === 'profile') return <IconsaxProfileIcon size={size} color={color} />;
  return null;
}

function AnimatedTabPill({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const opacity = useSharedValue(focused ? 1 : 0);
  const scale = useSharedValue(focused ? 1 : 0.85);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
    scale.value = withTiming(focused ? 1 : 0.85, { duration: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 40 }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 52,
            height: 40,
            borderRadius: 999,
            backgroundColor: ACTIVE_BG,
          },
          animStyle,
        ]}
      />
      {children}
    </View>
  );
}

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const tabs: Tab[] = useMemo(
    () => [
      {
        key: 'home',
        route: '/health-service',
        match: isHomePath,
      },
      {
        key: 'appointments',
        route: '/health-service/appointments',
        match: isAppointmentsPath,
      },
      {
        key: 'profile',
        route: '/(tabs)/profiles',
        match: isProfilePath,
      },
    ],
    [],
  );

  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  if (!isTabBarVisible(pathname)) return null;

  function handlePress(tab: Tab, focused: boolean) {
    if (focused) return;
    router.replace(tab.route as never);
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 28,
        paddingBottom: bottomOffset,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          paddingVertical: 12,
          paddingHorizontal: 6,
          shadowColor: 'rgba(129, 128, 128, 0.99)',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 14,
        }}>
        {tabs.map((tab) => {
          const focused = tab.match(pathname);
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.key}
              accessibilityState={{ selected: focused }}
              onPress={() => handlePress(tab, focused)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <AnimatedTabPill focused={focused}>
                <TabIcon tabKey={tab.key} focused={focused} />
              </AnimatedTabPill>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
