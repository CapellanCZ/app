import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import { AndroidFloatingTabBar } from '@/components/layout/AndroidFloatingTabBar';
import { openDefaultBooking } from '@/lib/health-service/openDefaultBooking';

/**
 * Tabs — Home · Book (+) center · Profile.
 * iOS keeps NativeTabs (liquid glass). Android uses the floating cutout dock.
 */
export default function TabLayout() {
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        tintColor="#007AFF"
        backgroundColor="#FFFFFF"
        blurEffect="systemChromeMaterial"
        disableTransparentOnScrollEdge
        minimizeBehavior="never"
        labelVisibilityMode="unlabeled"
        iconColor={{ default: '#8E8E93', selected: '#007AFF' }}>
        <NativeTabs.Trigger name="index">
          <Label hidden>Home</Label>
          <Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            drawable="ic_menu_home"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="book">
          <Label hidden>Book</Label>
          <Icon sf="plus" drawable="ic_input_add" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profiles">
          <Label hidden>Profile</Label>
          <Icon
            sf={{ default: 'person', selected: 'person.fill' }}
            drawable="ic_menu_myplaces"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: '#F9F9F9' },
      }}
      tabBar={(props) => <AndroidFloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="book"
        options={{ title: 'Book' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            void openDefaultBooking();
          },
        }}
      />
      <Tabs.Screen name="profiles" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
