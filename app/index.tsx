import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';

/** Entry `/` → clinic home, not-enrolled, or login. */
export default function Index() {
  const router = useRouter();
  const { session, isLoading, isConfigured, enrollmentStatus, isEnrollmentLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isConfigured) {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace('/(auth)');
      return;
    }

    if (!session) {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace('/(auth)');
      return;
    }

    if (isEnrollmentLoading || enrollmentStatus === 'unknown') return;

    if (hasRedirected.current) return;
    hasRedirected.current = true;

    if (enrollmentStatus === 'not_enrolled') {
      router.replace('/(auth)/not-enrolled' as never);
      return;
    }

    router.replace('/(tabs)' as never);
  }, [isLoading, isConfigured, session, enrollmentStatus, isEnrollmentLoading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#2970FF" />
    </View>
  );
}
