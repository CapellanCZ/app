import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { SplashBrand } from '@/components/splash/SplashBrand';
import { useAuth } from '@/lib/auth/AuthProvider';
import { prefetchCoreData } from '@/lib/bootstrap/prefetchCoreData';

/** Brief hold so the brand can read before routing away. */
const MIN_SPLASH_MS = 700;

/** Entry `/` → clinic home, not-enrolled, or login. Prefetches core data while branded splash shows. */
export default function Index() {
  const router = useRouter();
  const { session, isLoading, isConfigured, enrollmentStatus, isEnrollmentLoading } = useAuth();
  const hasRedirected = useRef(false);
  const bootStarted = useRef(false);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minSplashElapsed) return;
    if (isLoading) return;
    if (bootStarted.current || hasRedirected.current) return;

    if (!isConfigured || !session) {
      bootStarted.current = true;
      hasRedirected.current = true;
      router.replace('/(auth)');
      return;
    }

    if (isEnrollmentLoading || enrollmentStatus === 'unknown') return;

    bootStarted.current = true;

    void (async () => {
      if (enrollmentStatus === 'enrolled' && session.user?.id) {
        await prefetchCoreData(session.user.id, {
          email: session.user.email ?? undefined,
          userMetadata: session.user.user_metadata as Record<string, unknown> | undefined,
        });
      }

      if (hasRedirected.current) return;
      hasRedirected.current = true;

      if (enrollmentStatus === 'not_enrolled') {
        router.replace('/(auth)/not-enrolled' as never);
        return;
      }

      router.replace('/(tabs)' as never);
    })();
  }, [
    minSplashElapsed,
    isLoading,
    isConfigured,
    session,
    enrollmentStatus,
    isEnrollmentLoading,
    router,
  ]);

  return <SplashBrand />;
}
