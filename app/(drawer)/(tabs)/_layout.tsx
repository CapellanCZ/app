import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import {
  HOME_TAB_ICON_ACTIVE,
  HOME_TAB_ICON_INACTIVE,
  IconsaxHomeTabIcon,
} from '@/components/icons/IconsaxHomeTabIcon';
import { IconsaxNotificationTabIcon } from '@/components/icons/IconsaxNotificationTabIcon';
import { IconsaxProfileTabIcon } from '@/components/icons/IconsaxProfileTabIcon';

/** Extra space above tab icons; increase for more breathing room. */
const TAB_BAR_ICON_MARGIN_TOP = 25;

/** Space between the icon and the label on the active tab. */
const TAB_BAR_LABEL_MARGIN_TOP = 4;

function CenteredTabBarButton(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      style={[props.style, { justifyContent: 'center' }]}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: HOME_TAB_ICON_ACTIVE,
        tabBarInactiveTintColor: HOME_TAB_ICON_INACTIVE,
        tabBarButton: (props) => <CenteredTabBarButton {...props} />,
        tabBarIconStyle: { marginTop: TAB_BAR_ICON_MARGIN_TOP },
        tabBarLabel: ({ focused, color, children }) =>
          focused ? (
            <Text
              style={{
                color,
                fontSize: 13,
                fontWeight: '400',
                marginTop: 3,
              }}>
              {children}
            </Text>
          ) : null,
        sceneStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <IconsaxHomeTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          tabBarIcon: ({ focused }) => (
            <IconsaxNotificationTabIcon focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <IconsaxProfileTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          href: null,
          title: 'Appointments',
        }}
      />
    </Tabs>
  );
}
