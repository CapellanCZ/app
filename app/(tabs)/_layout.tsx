import { Tabs } from 'expo-router';

import { AndroidFloatingTabBar } from '@/components/layout/AndroidFloatingTabBar';
import { onBookTabPress } from '@/lib/navigation/bookTabAction';

/**
 * Tabs — Home · Book · Profile in a floating center pill.
 * Book opens booking without staying on the book route.
 */
export default function TabLayout() {
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
        listeners={{ tabPress: onBookTabPress }}
      />
      <Tabs.Screen name="profiles" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
