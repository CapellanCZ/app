import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/components/layout/BottomTabBar';

export default function TabLayout() {
  return (
    <>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="profiles" />
        <Tabs.Screen name="appointments" />
        <Tabs.Screen name="notification" />
      </Tabs>
      <BottomTabBar />
    </>
  );
}
