import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

/** Route groups that handle their own unauthenticated flow. */
const PUBLIC_ROOTS = new Set(['(auth)', 'logout']);

/** Screens anyone can open while signed out (legal docs from get-started / login). */
const PUBLIC_SCREENS = new Set(['terms', 'privacy']);

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
    const leaf = segments[segments.length - 1];

    // Stay on auth flow, logout, or public legal pages.
    if (!root || PUBLIC_ROOTS.has(root)) {
      isRedirecting.current = false;
      return;
    }
    if (typeof leaf === 'string' && PUBLIC_SCREENS.has(leaf)) {
      isRedirecting.current = false;
      return;
    }

    if (isRedirecting.current) return;

    isRedirecting.current = true;
    router.replace('/(auth)');
  }, [isConfigured, isLoading, session, segments, router]);

  return null;
}
