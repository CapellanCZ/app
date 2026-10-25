import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { SplashBrand } from '@/components/splash/SplashBrand';
import { useAuth } from '@/lib/auth/AuthProvider';
import { prefetchCoreData } from '@/lib/bootstrap/prefetchCoreData';
import { SPLASH_DESIGN } from '@/lib/splash/splashTiming';

/**
 * Entry `/` — Figma splash (gradient → branded → Slow handoff), then one-way
 * replace into onboarding (`/(auth)`) or clinic home. Back cannot return here.
 */
export default function Index() {
  const router = useRouter();
  const { session, isLoading, isConfigured, enrollmentStatus, isEnrollmentLoading } = useAuth();
  const hasRedirected = useRef(false);
  const [splashDone, setSplashDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Prefetch enrolled home data while branded splash is visible.
  useEffect(() => {
    if (isLoading) return;
    if (!isConfigured || !session) {
      setAuthReady(true);
      return;
    }
    if (isEnrollmentLoading || enrollmentStatus === 'unknown') return;

    let cancelled = false;
    void (async () => {
      if (enrollmentStatus === 'enrolled' && session.user?.id) {
        await prefetchCoreData(session.user.id, {
          email: session.user.email ?? undefined,
          userMetadata: session.user.user_metadata as Record<string, unknown> | undefined,
        });
      }
      if (!cancelled) setAuthReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isConfigured, session, enrollmentStatus, isEnrollmentLoading]);

  const tryRedirect = useCallback(() => {
    if (hasRedirected.current) return;
    if (!splashDone || !authReady || isLoading) return;
    if (isConfigured && session && (isEnrollmentLoading || enrollmentStatus === 'unknown')) {
      return;
    }

    hasRedirected.current = true;

    if (!isConfigured || !session) {
      // Prototype destination: onboarding / get-started (first slide).
      router.replace('/(auth)');
      return;
    }

    if (enrollmentStatus === 'not_enrolled') {
      router.replace('/(auth)/not-enrolled' as never);
      return;
    }

    router.replace('/(tabs)' as never);
  }, [
    splashDone,
    authReady,
    isLoading,
    isConfigured,
    session,
    enrollmentStatus,
    isEnrollmentLoading,
    router,
  ]);

  useEffect(() => {
    tryRedirect();
  }, [tryRedirect]);

  return (
    <View style={styles.root}>
      {/* Underlay so Slow fade-out never flashes white/black before replace. */}
      <LinearGradient
        colors={[...SPLASH_DESIGN.gradient.colors]}
        locations={[...SPLASH_DESIGN.gradient.locations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SplashBrand
        canExit={authReady && !isLoading}
        onFinished={() => setSplashDone(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#004EEB',
  },
});
