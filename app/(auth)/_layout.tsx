import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

/**
 * Unauthenticated routes (get-started, login shim, not-enrolled).
 * Login UI is hosted at root via LoginSheetHost (RN Modal) for a reliable dim scrim.
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
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="not-enrolled" options={{ animation: 'fade' }} />
    </Stack>
  );
}
