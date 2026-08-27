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
import Svg, { Path, Rect } from 'react-native-svg';

import { Inter } from '@/lib/typography/inter';

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

/** Single four-point sparkle (reference CTA). */
function SparkleIcon({ size = 16 }: { size?: number }) {
  const m = size / 2;
  const tip = size * 0.09;
  const d = [
    `M${m} 0`,
    `C${m + tip} ${m * 0.35} ${m + tip} ${m * 0.55} ${size} ${m}`,
    `C${m + tip} ${m * 1.45} ${m + tip} ${m * 1.65} ${m} ${size}`,
    `C${m - tip} ${m * 1.65} ${m - tip} ${m * 1.45} 0 ${m}`,
    `C${m - tip} ${m * 0.55} ${m - tip} ${m * 0.35} ${m} 0`,
    'Z',
  ].join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={d} fill="#FFFFFF" />
    </Svg>
  );
}

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
 * Professional black CTA — border comet, expanding soft pulse, spring press.
 */
export function GetStartedGlassButton({
  label = 'Get Started',
  onPress,
  disabled = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [ringSize, setRingSize] = useState({ w: 0, h: 0 });
  const press = useSharedValue(0);
  const pulse = useSharedValue(0);
  const sparkle = useSharedValue(0.7);

  useEffect(() => {
    if (reduceMotion) {
      pulse.set(0);
      sparkle.set(0.85);
      return;
    }

    // Fade fully out before loop reset so the scale jump is invisible.
    pulse.set(0);
    pulse.set(
      withRepeat(withTiming(1, { duration: PULSE_MS, easing: SMOOTH }), -1, false),
    );
    sparkle.set(
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(pulse);
      cancelAnimation(sparkle);
    };
  }, [pulse, sparkle, reduceMotion]);

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

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparkle.get(), [0, 1], [0.72, 1]),
    transform: [{ scale: interpolate(sparkle.get(), [0, 1], [0.97, 1.03]) }],
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
                colors={['#3A3A3A', '#1A1A1A', '#0A0A0A']}
                locations={[0, 0.42, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <Animated.View pointerEvents="none" style={[styles.innerGlow, innerGlowStyle]} />

              <Animated.View pointerEvents="none" style={[styles.topBevel, specularStyle]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.1)', 'transparent']}
                  locations={[0, 0.28, 0.75]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.content}>
                <Animated.View style={sparkleStyle}>
                  <SparkleIcon size={15} />
                </Animated.View>
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
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ring: {
    borderRadius: 999,
    padding: 2.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  face: {
    height: 50,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
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
