import { Stack } from 'expo-router';

/** Nested stack; add screens alongside `index.tsx` (e.g. `detail.tsx`). Drawer title stays in `(drawer)/_layout.tsx`. */
export default function HealthServiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
