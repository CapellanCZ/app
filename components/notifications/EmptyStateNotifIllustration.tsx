import { useId } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type Props = {
  size?: number;
};

/** `assets/empty-state-notif.svg` — notifications empty state illustration. */
export function EmptyStateNotifIllustration({ size = 160 }: Props) {
  const clipId = useId().replace(/:/g, '');
  const paint0 = `${clipId}_p0`;
  const paint1 = `${clipId}_p1`;
  const paint2 = `${clipId}_p2`;
  const paint3 = `${clipId}_p3`;

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width={160} height={160} rx={80} />
        </ClipPath>
        <LinearGradient id={paint0} x1="101.746" y1="32" x2="101.746" y2="123" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={paint1} x1="47.5" y1="0" x2="47.5" y2="91" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={paint2} x1="80.5" y1="94" x2="80.5" y2="142" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#2970FF" />
          <Stop offset="0.434782" stopColor="#528BFF" />
          <Stop offset="1" stopColor="#84ADFF" />
        </LinearGradient>
        <LinearGradient id={paint3} x1="80.5" y1="66.6667" x2="80.5" y2="142" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Rect width={160} height={160} rx={80} fill="#F2F3FF" />
        <Rect
          opacity={0.8}
          x={54.2461}
          y={32}
          width={95}
          height={91}
          rx={10.6667}
          fill={`url(#${paint0})`}
          transform="rotate(9.96425 54.2461 32)"
        />
        <Rect
          opacity={0.8}
          width={95}
          height={91}
          rx={10.6667}
          fill={`url(#${paint1})`}
          transform="matrix(-0.984916 0.173034 0.173034 0.984916 103.067 32)"
        />
        <Rect x={32.5} y={34} width={95} height={91} rx={10.6667} fill="white" />
        <Rect x={42.5} y={42} width={76} height={25} rx={6.66667} fill="#ECEDF8" />
        <Rect x={59.5} y={75} width={42} height={9} rx={4.5} fill="#ECEDF8" />
        <Circle
          cx={80.5}
          cy={118}
          r={22.6667}
          fill={`url(#${paint2})`}
          stroke={`url(#${paint3})`}
          strokeWidth={2.66667}
        />
        <Path
          d="M78.4998 124.667H69.8332V122H78.4998C81.0772 122 83.1665 124.089 83.1665 126.667C83.1665 129.244 81.0772 131.333 78.4998 131.333C76.4993 131.333 74.7927 130.075 74.1291 128.306L76.6267 127.369C76.9111 128.127 77.6425 128.667 78.4998 128.667C79.6044 128.667 80.4998 127.771 80.4998 126.667C80.4998 125.562 79.6044 124.667 78.4998 124.667ZM71.1665 116.667H89.1665C91.7438 116.667 93.8332 118.756 93.8332 121.333C93.8332 123.911 91.7438 126 89.1665 126C87.166 126 85.4594 124.741 84.7958 122.972L87.2933 122.036C87.5777 122.794 88.3092 123.333 89.1665 123.333C90.271 123.333 91.1665 122.438 91.1665 121.333C91.1665 120.229 90.271 119.333 89.1665 119.333H71.1665C68.9574 119.333 67.1665 117.543 67.1665 115.333C67.1665 113.124 68.9574 111.333 71.1665 111.333H82.4998C83.6044 111.333 84.4998 110.438 84.4998 109.333C84.4998 108.229 83.6044 107.333 82.4998 107.333C81.6425 107.333 80.911 107.873 80.6266 108.631L78.1292 107.694C78.7928 105.926 80.4993 104.667 82.4998 104.667C85.0772 104.667 87.1665 106.756 87.1665 109.333C87.1665 111.911 85.0772 114 82.4998 114H71.1665C70.4301 114 69.8332 114.597 69.8332 115.333C69.8332 116.07 70.4301 116.667 71.1665 116.667Z"
          fill="white"
        />
      </G>
    </Svg>
  );
}
