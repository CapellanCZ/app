import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

/** Routes that handle their own unauthenticated flow. */
const PUBLIC_ROOTS = new Set(['(auth)', 'logout']);

/**
 * Sends signed-out users back to login when they are on a protected screen.
 * Index (`/`) handles its own bootstrap redirect.
 */
export function AuthSessionGuard() {
  const { session, isLoading, isConfigured } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (!isConfigured || isLoading || session) {
      isRedirecting.current = false;
      return;
    }

    const root = segments[0];
    if (!root || PUBLIC_ROOTS.has(root)) return;
    if (isRedirecting.current) return;

    isRedirecting.current = true;
    router.replace('/(auth)');
  }, [isConfigured, isLoading, session, segments, router]);

  return null;
}
