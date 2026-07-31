import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

/**
 * Unauthenticated routes (get-started, login, not-enrolled).
 * The `(auth)` segment is omitted from the URL — e.g. this stack serves `/login`.
 */
export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const sceneBackground = colorScheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1, backgroundColor: sceneBackground },
      }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="login"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="not-enrolled" options={{ animation: 'fade' }} />
    </Stack>
  );
}
