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
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { Inter } from '@/lib/typography/inter';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
  const coreLen = Math.max(peri * 0.16, 28);
  const softLen = Math.max(peri * 0.28, 48);

  useEffect(() => {
    progress.set(0);
    progress.set(
      withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false),
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
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={stroke + 3}
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
          stroke="rgba(255,255,255,0.95)"
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
  const [ringSize, setRingSize] = useState({ w: 0, h: 0 });
  const press = useSharedValue(0);
  const pulse = useSharedValue(0);
  const pulseB = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    // Primary expanding pulse (~2.8s cycle)
    pulse.set(
      withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
    // Second wave — offset so they never peak together
    pulseB.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 900 }),
          withTiming(1, { duration: 2800, easing: Easing.out(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
    sparkle.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(pulseB);
      cancelAnimation(sparkle);
    };
  }, [pulse, pulseB, sparkle]);

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.get(), [0, 1], [1, 0.975]) }],
  }));

  /** Expanding soft ring — grows out + fades (pro CTA pulse). */
  const pulseRingAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.get(), [0, 0.15, 0.7, 1], [0, 0.4, 0.12, 0]),
    transform: [{ scale: interpolate(pulse.get(), [0, 1], [1, 1.12]) }],
  }));

  const pulseRingBStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseB.get(), [0, 0.15, 0.7, 1], [0, 0.28, 0.08, 0]),
    transform: [{ scale: interpolate(pulseB.get(), [0, 1], [1, 1.1]) }],
  }));

  /** Inner fill glow that softens in sync with the pulse head. */
  const innerGlowStyle = useAnimatedStyle(() => {
    const head = Math.max(
      interpolate(pulse.get(), [0, 0.2, 0.55, 1], [0, 1, 0.35, 0]),
      interpolate(pulseB.get(), [0, 0.2, 0.55, 1], [0, 0.7, 0.25, 0]),
    );
    return {
      opacity: 0.12 + head * 0.22,
    };
  });

  const specularStyle = useAnimatedStyle(() => {
    const head = interpolate(pulse.get(), [0, 0.25, 0.6, 1], [0.65, 1, 0.8, 0.65]);
    return { opacity: head };
  });

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparkle.get(), [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(sparkle.get(), [0, 1], [0.94, 1.05]) }],
  }));

  const onRingLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setRingSize((prev) =>
      prev.w === width && prev.h === height ? prev : { w: width, h: height },
    );
  };

  const handlePressIn = () => {
    if (disabled) return;
    press.set(withSpring(1, { damping: 22, stiffness: 420 }));
  };

  const handlePressOut = () => {
    press.set(withSpring(0, { damping: 18, stiffness: 280 }));
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
      accessibilityState={{ disabled }}>
      <Animated.View style={[styles.outerGlow, rootStyle]}>
        {/* Dual expanding pulse rings */}
        <Animated.View pointerEvents="none" style={[styles.pulseRing, pulseRingAStyle]} />
        <Animated.View pointerEvents="none" style={[styles.pulseRingSoft, pulseRingBStyle]} />

        <View style={styles.ring} onLayout={onRingLayout}>
          {ringSize.w > 0 ? (
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

            <AnimatedLinearGradient
              colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'transparent']}
              locations={[0, 0.22, 0.7]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.topBevel, specularStyle]}
            />

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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerGlow: {
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'transparent',
  },
  pulseRingSoft: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
