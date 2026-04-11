import { Stack } from 'expo-router';

/**
 * Nested stack for Discipline Office: add routes as files next to `index.tsx`
 * (e.g. `detail.tsx` → `/discipline-office/detail`).
 */
export default function DisciplineOfficeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
