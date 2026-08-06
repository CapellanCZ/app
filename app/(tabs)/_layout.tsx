import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

/**
 * Liquid-glass UITabBar — Home · Book (+) center · Profile.
 * Icon-only. Opaque bar so chrome stays easy to see.
 */
export default function TabLayout() {
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
