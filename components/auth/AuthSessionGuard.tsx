import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

/** Route groups that handle their own unauthenticated flow. */
const PUBLIC_ROOTS = new Set(['(auth)', 'logout']);

/** Screens anyone can open while signed out (legal docs from get-started / login). */
const PUBLIC_SCREENS = new Set(['terms', 'privacy']);

/**
 * Sends signed-out users back to login when they are on a protected screen.
 * Also keeps not-enrolled users on the enrollment screen.
 * Index (`/`) handles its own bootstrap redirect.
 */
export function AuthSessionGuard() {
  const { session, isLoading, isConfigured, enrollmentStatus, isEnrollmentLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (!isConfigured || isLoading) {
      isRedirecting.current = false;
      return;
    }

    const root = segments[0];
    const leaf = segments[segments.length - 1];
    const onAuth = root === '(auth)';
    const onNotEnrolled =
      onAuth && typeof leaf === 'string' && leaf === 'not-enrolled';

    // Stay on auth flow, logout, or public legal pages when signed out.
    if (!session) {
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
      return;
    }

    // Enrolled / still loading enrollment — allow app.
    if (isEnrollmentLoading || enrollmentStatus === 'unknown' || enrollmentStatus === 'enrolled') {
      isRedirecting.current = false;
      return;
    }

    // Signed in but not on clinic roster — force enrollment screen.
    if (enrollmentStatus === 'not_enrolled') {
      if (onNotEnrolled) {
        isRedirecting.current = false;
        return;
      }
      if (typeof leaf === 'string' && PUBLIC_SCREENS.has(leaf)) {
        isRedirecting.current = false;
        return;
      }
      if (isRedirecting.current) return;
      isRedirecting.current = true;
      router.replace('/(auth)/not-enrolled');
    }
  }, [
    isConfigured,
    isLoading,
    session,
    enrollmentStatus,
    isEnrollmentLoading,
    segments,
    router,
  ]);

  return null;
}
