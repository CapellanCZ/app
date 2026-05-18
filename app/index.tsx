import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';

/** Entry `/` → route to Health Service if authenticated, login otherwise. */
export default function Index() {
  const router = useRouter();
  const { session, isLoading, isConfigured } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;
    hasRedirected.current = true;

    if (!isConfigured || session) {
      router.replace('/health-service');
    } else {
      router.replace('/(auth)');
    }
  }, [isLoading, isConfigured, session, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#2970FF" />
    </View>
  );
}
