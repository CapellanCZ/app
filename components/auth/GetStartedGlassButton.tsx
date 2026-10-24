import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { Inter } from '@/lib/typography/inter';
import { BRAND } from '@/lib/ui/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Soft ease — no abrupt start/stop on looping pulses. */
const SMOOTH = Easing.bezier(0.4, 0.0, 0.2, 1);
const PULSE_MS = 3600;
const ORBIT_MS = 6400;

type Props = {
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
};

function stadiumPerimeter(width: number, height: number) {
  const r = height / 2;
  return 2 * (width - height) + 2 * Math.PI * r;
}

/**
 * Soft comet traveling the pill edge — longer trail, UI-thread.
 */
function CirclingBorderGlow({ width, height }: { width: number; height: number }) {
  const progress = useSharedValue(0);
  const stroke = 2;
  const inset = stroke / 2;
  const rw = Math.max(width - stroke, 0);
  const rh = Math.max(height - stroke, 0);
  const radius = rh / 2;
  const peri = stadiumPerimeter(rw, rh);
  const coreLen = Math.max(peri * 0.14, 26);
  const softLen = Math.max(peri * 0.32, 52);

  useEffect(() => {
    progress.set(0);
    progress.set(
      withRepeat(withTiming(1, { duration: ORBIT_MS, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(progress);
  }, [progress, peri]);

  const softProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.get() * peri,
  }));
  const coreProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.get() * peri,
  }));

  if (rw <= 0 || rh <= 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <AnimatedRect
          x={inset}
          y={inset}
          width={rw}
          height={rh}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={stroke + 4}
          strokeLinecap="round"
          strokeDasharray={`${softLen} ${Math.max(peri - softLen, 1)}`}
          animatedProps={softProps}
        />
        <AnimatedRect
          x={inset}
          y={inset}
          width={rw}
          height={rh}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${coreLen} ${Math.max(peri - coreLen, 1)}`}
          animatedProps={coreProps}
        />
      </Svg>
    </View>
  );
}

/**
 * Brand primary CTA — border comet, expanding soft pulse, spring press.
 */
export function GetStartedGlassButton({
  label = "Let's get started!",
  onPress,
  disabled = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [ringSize, setRingSize] = useState({ w: 0, h: 0 });
  const press = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.set(0);
      return;
    }

    // Fade fully out before loop reset so the scale jump is invisible.
    pulse.set(0);
    pulse.set(
      withRepeat(withTiming(1, { duration: PULSE_MS, easing: SMOOTH }), -1, false),
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, reduceMotion]);

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.get(), [0, 1], [1, 0.97]) }],
  }));

  /** Expanding soft ring — opacity hits 0 at the end so the loop reset is seamless. */
  const pulseRingStyle = useAnimatedStyle(() => {
    const t = pulse.get();
    return {
      opacity: interpolate(t, [0, 0.12, 0.55, 0.92, 1], [0, 0.32, 0.14, 0.04, 0]),
      transform: [{ scale: interpolate(t, [0, 1], [1, 1.08]) }],
    };
  });

  const pulseHaloStyle = useAnimatedStyle(() => {
    const t = pulse.get();
    return {
      opacity: interpolate(t, [0, 0.18, 0.6, 1], [0, 0.1, 0.04, 0]),
      transform: [{ scale: interpolate(t, [0, 1], [1, 1.14]) }],
    };
  });

  /** Inner fill glow — gentle breathe, no hard peaks. */
  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.get(), [0, 0.2, 0.5, 0.85, 1], [0.1, 0.2, 0.26, 0.14, 0.1]),
  }));

  const specularStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.get(), [0, 0.35, 0.7, 1], [0.55, 0.78, 0.62, 0.55]),
  }));

  const onRingLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setRingSize((prev) =>
      prev.w === width && prev.h === height ? prev : { w: width, h: height },
    );
  };

  const handlePressIn = () => {
    if (disabled) return;
    press.set(withSpring(1, { damping: 24, stiffness: 380, mass: 0.6 }));
  };

  const handlePressOut = () => {
    press.set(withSpring(0, { damping: 20, stiffness: 260, mass: 0.7 }));
  };

  const handlePress = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={
        Platform.OS === 'android'
          ? { color: 'rgba(255,255,255,0.14)', borderless: false, foreground: true }
          : undefined
      }
      hitSlop={Platform.OS === 'android' ? 6 : undefined}>
      {/* Extra padding so expanding glow isn't clipped. */}
      <View style={styles.glowPad}>
        <Animated.View style={[styles.outerGlow, rootStyle]}>
          {!reduceMotion ? (
            <>
              <Animated.View pointerEvents="none" style={[styles.pulseHalo, pulseHaloStyle]} />
              <Animated.View pointerEvents="none" style={[styles.pulseRing, pulseRingStyle]} />
            </>
          ) : null}

          <View style={styles.ring} onLayout={onRingLayout}>
            {!reduceMotion && ringSize.w > 0 ? (
              <CirclingBorderGlow width={ringSize.w} height={ringSize.h} />
            ) : null}

            <View style={styles.face}>
              <LinearGradient
                colors={[BRAND.primaryCard, BRAND.primary, BRAND.primaryDeep]}
                locations={[0, 0.45, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <Animated.View pointerEvents="none" style={[styles.innerGlow, innerGlowStyle]} />

              <Animated.View pointerEvents="none" style={[styles.topBevel, specularStyle]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)', 'transparent']}
                  locations={[0, 0.28, 0.75]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <LinearGradient
                colors={['transparent', 'rgba(0, 40, 140, 0.35)']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.content}>
                <Text style={styles.label}>{label}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowPad: {
    // Room for pulse scale without clipping against parent overflow.
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginVertical: -10,
    marginHorizontal: -6,
  },
  outerGlow: {
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
  },
  pulseHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 78, 235, 0.12)',
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'transparent',
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  ring: {
    borderRadius: 999,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: BRAND.primary,
  },
  face: {
    height: 54,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  topBevel: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: 14,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 22,
    zIndex: 2,
  },
  label: {
    fontFamily: Inter.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.25,
  },
});
