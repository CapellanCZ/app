import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
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
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    void SplashScreen.hideAsync().finally(() => setNativeSplashHidden(true));
  }, []);

  useEffect(() => {
    if (!nativeSplashHidden) return;
    if (isLoading) return;
    if (bootStarted.current || hasRedirected.current) return;

    if (!isConfigured || !session) {
      bootStarted.current = true;
      const started = Date.now();
      const go = () => {
        if (hasRedirected.current) return;
        hasRedirected.current = true;
        router.replace('/(auth)');
      };
      const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
      const t = setTimeout(go, remaining);
      return () => clearTimeout(t);
    }

    if (isEnrollmentLoading || enrollmentStatus === 'unknown') return;

    bootStarted.current = true;
    const started = Date.now();

    void (async () => {
      if (enrollmentStatus === 'enrolled' && session.user?.id) {
        await prefetchCoreData(session.user.id, {
          email: session.user.email ?? undefined,
          userMetadata: session.user.user_metadata as Record<string, unknown> | undefined,
        });
      }

      const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
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
    nativeSplashHidden,
    isLoading,
    isConfigured,
    session,
    enrollmentStatus,
    isEnrollmentLoading,
    router,
  ]);

  return <SplashBrand />;
}
