import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

/**
 * Unauthenticated routes (login, register, forgot-password, etc.).
 * The `(auth)` segment is omitted from the URL — e.g. this stack serves `/login`.
 */
export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const sceneBackground = colorScheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        // Without flex:1 the scene can collapse to zero height → blank screen.
        // Scene color fills the home-indicator / gesture strip behind the auth UI.
        contentStyle: { flex: 1, backgroundColor: sceneBackground },
      }}
    />
  );
}
