import { router, usePathname } from 'expo-router';
<<<<<<< HEAD
import { useEffect, useMemo } from 'react';
=======
import { useEffect } from 'react';
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
import { Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BriefcaseIcon } from '@/components/icons/BriefcaseIcon';
<<<<<<< HEAD
=======
import { HomeIcon } from '@/components/icons/HomeIcon';
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
import { IconsaxMedalIcon } from '@/components/icons/IconsaxMedalIcon';
import { IconsaxProfileIcon } from '@/components/icons/IconsaxProfileIcon';
import { StethoscopeIcon } from '@/components/icons/StethoscopeIcon';

export const TAB_BAR_HEIGHT = 80;

<<<<<<< HEAD
function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function isDepartmentIndex(pathname: string, base: string): boolean {
  const path = normalizePathname(pathname);
  return path === base || path === `${base}/index`;
}

function isTabBarVisible(pathname: string, sdaoRoute: string): boolean {
  const path = normalizePathname(pathname);

  if (path === '/(tabs)/profiles' || path.endsWith('/profiles')) return true;

  if (path === '/discipline-office' || path === '/discipline-office/index') return true;
  if (path === '/health-service' || path === '/health-service/index') return true;
  if (path === sdaoRoute || path === `${sdaoRoute}/index`) return true;
  if (path === '/student-development-affairs' || path === '/student-development-affairs/index') {
    return true;
  }

  return false;
=======
const VISIBLE_ROUTES = [
  '/',
  '/(tabs)',
  '/(tabs)/index',
  '/discipline-office',
  '/health-service',
  '/student-development-affairs',
  '/(tabs)/profiles',
  '/profiles',
];

function isTabBarVisible(pathname: string): boolean {
  return VISIBLE_ROUTES.includes(pathname);
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
}

const ACTIVE_BG = '#2970FF';
const ICON_ACTIVE = '#FFFFFF';
const ICON_INACTIVE = '#9095A1';

type Tab = {
  key: string;
  route: string;
  match: (pathname: string) => boolean;
};

<<<<<<< HEAD
=======
const TABS: Tab[] = [
  {
    key: 'home',
    route: '/(tabs)',
    match: (p) => p === '/' || p === '/(tabs)' || p === '/(tabs)/index',
  },
  {
    key: 'discipline',
    route: '/discipline-office',
    match: (p) => p.startsWith('/discipline-office'),
  },
  {
    key: 'health',
    route: '/health-service',
    match: (p) => p.startsWith('/health-service'),
  },
  {
    key: 'student-dev',
    route: '/student-development-affairs',
    match: (p) => p.startsWith('/student-development-affairs'),
  },
  {
    key: 'profile',
    route: '/(tabs)/profiles',
    match: (p) => p === '/(tabs)/profiles' || p.endsWith('/profiles'),
  },
];

>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
function TabIcon({ tabKey, focused }: { tabKey: string; focused: boolean }) {
  const color = focused ? ICON_ACTIVE : ICON_INACTIVE;
  const size = 22;

<<<<<<< HEAD
=======
  if (tabKey === 'home') return <HomeIcon size={size} color={color} />;
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
  if (tabKey === 'discipline') return <BriefcaseIcon size={size} color={color} />;
  if (tabKey === 'health') return <StethoscopeIcon size={size} color={color} />;
  if (tabKey === 'student-dev') return <IconsaxMedalIcon size={size} color={color} />;
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
<<<<<<< HEAD
  const sdaoRoute = '/student-development-affairs';

  const tabs: Tab[] = useMemo(
    () => [
      {
        key: 'health',
        route: '/health-service',
        match: (p) => isDepartmentIndex(p, '/health-service'),
      },
      {
        key: 'discipline',
        route: '/discipline-office',
        match: (p) => isDepartmentIndex(p, '/discipline-office'),
      },
      {
        key: 'student-dev',
        route: sdaoRoute,
        match: (p) => isDepartmentIndex(p, sdaoRoute),
      },
      {
        key: 'profile',
        route: '/(tabs)/profiles',
        match: (p) => {
          const path = normalizePathname(p);
          return path === '/(tabs)/profiles' || path.endsWith('/profiles');
        },
      },
    ],
    [sdaoRoute],
  );

  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  if (!isTabBarVisible(pathname, sdaoRoute)) return null;

  function handlePress(tab: Tab, focused: boolean) {
    if (focused) return;
    router.replace(tab.route as never);
=======

  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  if (!isTabBarVisible(pathname)) return null;

  function handlePress(tab: Tab, focused: boolean) {
    if (focused) return;
    router.replace(tab.route as any);
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
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
<<<<<<< HEAD
        {tabs.map((tab) => {
=======
        {TABS.map((tab) => {
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
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
