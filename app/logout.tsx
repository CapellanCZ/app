import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Deep links to `/logout` must not force sign-out (availability attack via custom scheme).
 * In-app logout uses Profile → LogoutModal → signOutUser().
 */
export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/profiles');
  }, [router]);

  return <Stack.Screen options={{ headerShown: false, title: 'Logout' }} />;
}
