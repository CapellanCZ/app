import { Stack } from 'expo-router';

/**
 * Nested stack for Discipline Office: add routes as files next to `index.tsx`
 * (e.g. `detail.tsx` → `/discipline-office/detail`).
 */
export default function DisciplineOfficeLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
      }}>
      {/* Main hub: no stack slide when returning to this root from nested screens. */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
    </Stack>
  );
}
