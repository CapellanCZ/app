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
        animation: 'slide_from_right',
      }}>
      {/* Main hub: no stack slide on drawer open (avoids drawer + stack double animation). */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
    </Stack>
  );
}
