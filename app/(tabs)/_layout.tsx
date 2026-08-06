import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

/**
 * System iOS liquid-glass tab bar via Expo Router NativeTabs (UITabBar).
 * Real glass on iOS 26+ — not a custom React Native bar.
 *
 * Note: `@expo/ui` SwiftUI does not provide a tab bar; NativeTabs is the
 * Expo API for liquid glass tabs.
 *
 * Tabs: Home · Appointments · History · Profile
 */
export default function TabLayout() {
  return (
    <NativeTabs tintColor="#007AFF" minimizeBehavior="onScrollDown" labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="ic_menu_home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="appointments">
        <Label>Appointments</Label>
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} drawable="ic_menu_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} drawable="ic_menu_recent_history" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profiles">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="ic_menu_myplaces" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
