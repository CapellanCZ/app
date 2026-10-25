import { useCallback, useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { hideSplashScreenOnce } from '@/lib/bootstrap/splashScreen';
import {
  SPLASH_BRAND_TRANSITION_MS,
  SPLASH_BRANDED_AFTER_DELAY_MS,
  SPLASH_DESIGN,
  SPLASH_EXIT_TRANSITION_MS,
  SPLASH_GRADIENT_AFTER_DELAY_MS,
} from '@/lib/splash/splashTiming';

/** Exact Figma lockup — white symbol + “Campus Care” wordmark on transparent. */
const LOGO = require('../../assets/Logo.png');

type SplashBrandProps = {
  style?: StyleProp<ViewStyle>;
  /**
   * When true, the branded → next-screen Slow exit may begin after its after-delay.
   * Keeps the splash visible until auth/prefetch is ready for a one-way replace.
   */
  canExit?: boolean;
  /**
   * Called after the Slow exit animation completes.
   * Parent should `router.replace` so Back cannot return here.
   */
  onFinished?: () => void;
};

/**
 * CampusCare splash — stationary gradient, then Smart-Animate logo in,
 * then Slow handoff out. Matches Figma 375×812 references.
 */
export function SplashBrand({ style, canExit = true, onFinished }: SplashBrandProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const logoOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);
  const nativeHiddenRef = useRef(false);
  const brandShownAtRef = useRef<number | null>(null);
  const exitStartedRef = useRef(false);
  const canExitRef = useRef(canExit);

  canExitRef.current = canExit;

  const scaleX = screenW / SPLASH_DESIGN.width;
  /** `Logo.png` content aspect after trim (symbol + wordmark). */
  const LOGO_ASPECT = 86 / 179;
  const logoW = SPLASH_DESIGN.logo.width * scaleX;
  const logoH = logoW * LOGO_ASPECT;
  const logoTop = (SPLASH_DESIGN.logo.top / SPLASH_DESIGN.height) * screenH;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished?.();
  }, [onFinished]);

  const hideNative = useCallback(() => {
    if (nativeHiddenRef.current) return;
    nativeHiddenRef.current = true;
    void hideSplashScreenOnce();
  }, []);

  const startExit = useCallback(() => {
    if (exitStartedRef.current || finishedRef.current) return;
    exitStartedRef.current = true;
    /**
     * Figma “Slow” is a spring preset (steady settle, minimal overshoot),
     * not a cubic-bezier. Exact spring mass/stiffness/damping were not
     * available from the supplied screenshots — using a duration-based
     * critically-damped spring for the documented Slow fullscreen handoff.
     */
    screenOpacity.set(
      withSpring(
        0,
        {
          duration: SPLASH_EXIT_TRANSITION_MS,
          dampingRatio: 1,
          overshootClamping: true,
        },
        (finished) => {
          if (finished) {
            runOnJS(finish)();
          }
        },
      ),
    );
  }, [finish, screenOpacity]);

  useEffect(() => {
    // 1) Gradient-only after-delay (1_000 ms)
    const brandDelay = setTimeout(() => {
      // 2) Smart Animate → branded: 300 ms, Linear (opacity appear)
      logoOpacity.set(
        withTiming(1, {
          duration: SPLASH_BRAND_TRANSITION_MS,
          easing: Easing.linear,
        }),
      );

      const brandReady = setTimeout(() => {
        brandShownAtRef.current = Date.now();
        // 3) Branded after-delay (1_000 ms), then Slow exit when allowed
        const exitDelay = setTimeout(() => {
          if (canExitRef.current) {
            startExit();
          }
        }, SPLASH_BRANDED_AFTER_DELAY_MS);
        timersRef.current.push(exitDelay);
      }, SPLASH_BRAND_TRANSITION_MS);
      timersRef.current.push(brandReady);
    }, SPLASH_GRADIENT_AFTER_DELAY_MS);
    timersRef.current.push(brandDelay);

    return () => {
      clearTimers();
    };
  }, [clearTimers, logoOpacity, startExit]);

  // If branded hold already elapsed while waiting on auth, exit as soon as allowed.
  useEffect(() => {
    if (!canExit || exitStartedRef.current || finishedRef.current) return;
    if (brandShownAtRef.current == null) return;
    const elapsed = Date.now() - brandShownAtRef.current;
    const remaining = Math.max(0, SPLASH_BRANDED_AFTER_DELAY_MS - elapsed);
    const t = setTimeout(() => startExit(), remaining);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [canExit, startExit]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.get(),
  }));

  const rootStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.get(),
  }));

  return (
    <Animated.View
      style={[styles.root, rootStyle, style]}
      onLayout={hideNative}
      accessibilityLabel="CampusCare splash">
      {/* Dark status-bar content; home indicator stays system-managed. */}
      <StatusBar style="dark" />

      <LinearGradient
        colors={[...SPLASH_DESIGN.gradient.colors]}
        locations={[...SPLASH_DESIGN.gradient.locations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.logoWrap,
          {
            top: logoTop,
            width: logoW,
            height: logoH,
            marginLeft: -logoW / 2,
          },
          logoStyle,
        ]}>
        <Image
          source={LOGO}
          style={{ width: logoW, height: logoH }}
          resizeMode="contain"
          accessibilityLabel="Campus Care"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#004EEB',
  },
  logoWrap: {
    position: 'absolute',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
