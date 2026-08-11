import { useEffect, useRef } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size?: number;
  /** Draw-on animation for the check only; circle stays still. */
  animateCheck?: boolean;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Stroked check polyline — path length used for dash draw-on.
 * Tuned to sit inside the same Figma circle as the filled mark.
 */
const CHECK_STROKE = 'M28.5 47.2 L40.2 58.8 L66.8 32.8';
const CHECK_LENGTH = 62;
const CHECK_STROKE_WIDTH = 7.5;

/** Figma appointment-booked success mark (node 2248:91) — #65D900. */
export function AppointmentBookedCheckIcon({ size = 111, animateCheck = false }: Props) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = Boolean(animateCheck && !reduceMotion);
  const dashOffset = useSharedValue(shouldAnimate ? CHECK_LENGTH : 0);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) {
      dashOffset.set(0);
      return;
    }
    if (playedRef.current) return;
    playedRef.current = true;

    dashOffset.set(CHECK_LENGTH);
    dashOffset.set(
      withDelay(
        420,
        withTiming(0, {
          duration: 900,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
      ),
    );

    return () => {
      cancelAnimation(dashOffset);
    };
  }, [dashOffset, shouldAnimate]);

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.get(),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 92.5 92.5" fill="none">
      <Path
        opacity={0.4}
        d="M46.25 92.5C71.793 92.5 92.5 71.793 92.5 46.25C92.5 20.7068 71.793 0 46.25 0C20.7068 0 0 20.7068 0 46.25C0 71.793 20.7068 92.5 46.25 92.5Z"
        fill="#65D900"
      />
      {shouldAnimate ? (
        <AnimatedPath
          d={CHECK_STROKE}
          stroke="#65D900"
          strokeWidth={CHECK_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
          animatedProps={checkAnimatedProps}
        />
      ) : (
        <Path
          d="M39.682 62.8057C38.757 62.8057 37.8783 62.4356 37.2308 61.7881L24.1422 48.6994C22.801 47.3582 22.801 45.1381 24.1422 43.7969C25.4835 42.4557 27.7035 42.4557 29.0447 43.7969L39.682 54.4344L63.4545 30.662C64.7958 29.3207 67.0158 29.3207 68.357 30.662C69.6983 32.0032 69.6983 34.2232 68.357 35.5644L42.1333 61.7881C41.4858 62.4356 40.607 62.8057 39.682 62.8057Z"
          fill="#65D900"
        />
      )}
    </Svg>
  );
}
