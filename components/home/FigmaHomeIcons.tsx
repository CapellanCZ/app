import Svg, { G, Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/** Figma home quick-action: calendar bookings */
export function FigmaBookingsIcon({ size = 24, color = '#323232' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19.5 21.5" fill="none">
      <G>
        <Path
          d="M5.75 0.75V3.75"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.75 0.75V3.75"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1.25 7.83984H18.25"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M18.75 7.25V15.75C18.75 18.75 17.25 20.75 13.75 20.75H5.75C2.25 20.75 0.75 18.75 0.75 15.75V7.25C0.75 4.25 2.25 2.25 5.75 2.25H13.75C17.25 2.25 18.75 4.25 18.75 7.25Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M13.4447 12.4492H13.4537" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M13.4447 15.4492H13.4537" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M9.7455 12.4492H9.7545" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M9.7455 15.4492H9.7545" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M6.04431 12.4492H6.05329" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M6.04431 15.4492H6.05329" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

/** Figma home quick-action: vital signs chart */
export function FigmaVitalsIcon({ size = 24, color = '#323232' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21.51 21.5" fill="none">
      <G>
        <Path
          d="M7.75 20.75H13.75C18.75 20.75 20.75 18.75 20.75 13.75V7.75C20.75 2.75 18.75 0.75 13.75 0.75H7.75C2.75 0.75 0.75 2.75 0.75 7.75V13.75C0.75 18.75 2.75 20.75 7.75 20.75Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M0.75 11.4501L6.75 11.4301C7.5 11.4301 8.34 12.0001 8.62 12.7001L9.76003 15.5801C10.02 16.2301 10.43 16.2301 10.69 15.5801L12.98 9.7701C13.2 9.2101 13.61 9.1901 13.89 9.7201L14.93 11.6901C15.24 12.2801 16.04 12.7601 16.7 12.7601H20.76"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Figma home quick-action: more (three dots) */
export function FigmaMoreIcon({ size = 24, color = '#323232' }: Props) {
  const h = (size * 5.5) / 19.5;
  return (
    <Svg width={size} height={h} viewBox="0 0 19.5 5.5" fill="none">
      <G>
        <Path
          d="M2.75 0.75C1.65 0.75 0.75 1.65 0.75 2.75C0.75 3.85 1.65 4.75 2.75 4.75C3.85 4.75 4.75 3.85 4.75 2.75C4.75 1.65 3.85 0.75 2.75 0.75Z"
          fill={color}
          stroke={color}
          strokeWidth={1.5}
        />
        <Path
          d="M16.75 0.75C15.65 0.75 14.75 1.65 14.75 2.75C14.75 3.85 15.65 4.75 16.75 4.75C17.85 4.75 18.75 3.85 18.75 2.75C18.75 1.65 17.85 0.75 16.75 0.75Z"
          fill={color}
          stroke={color}
          strokeWidth={1.5}
        />
        <Path
          d="M9.75 0.75C8.65 0.75 7.75 1.65 7.75 2.75C7.75 3.85 8.65 4.75 9.75 4.75C10.85 4.75 11.75 3.85 11.75 2.75C11.75 1.65 10.85 0.75 9.75 0.75Z"
          fill={color}
          stroke={color}
          strokeWidth={1.5}
        />
      </G>
    </Svg>
  );
}

/** Figma blood-pressure droplet */
export function FigmaDropletIcon({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16.2 20" fill="none">
      <G>
        <Path
          d="M12.6901 5.41L2.41005 15.69C1.93005 16.17 1.11005 16.06 0.820054 15.45C0.300054 14.38 5.34334e-05 13.17 5.34334e-05 11.9C-0.0199466 6.38 5.58005 1.66 7.48009 0.21C7.85009 -0.07 8.35009 -0.07 8.71009 0.21C9.58009 0.87 11.2101 2.24 12.7401 4.04C13.0801 4.44 13.0601 5.04 12.6901 5.41Z"
          fill="#7E6B28"
        />
        <Path
          opacity={0.4}
          d="M16.2001 11.9103C16.2001 16.3703 12.5701 20.0003 8.10009 20.0003C6.31009 20.0003 4.64005 19.4203 3.29005 18.4203C2.80005 18.0603 2.76005 17.3403 3.19005 16.9103L13.2601 6.84026C13.7301 6.37026 14.5201 6.47026 14.8401 7.05026C15.6601 8.5603 16.2101 10.2003 16.2001 11.9103Z"
          fill="#7E6B28"
        />
      </G>
    </Svg>
  );
}

/** Figma heart-rate heart */
export function FigmaHeartRateIcon({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 18.91" fill="none">
      <G>
        <Path
          opacity={0.4}
          d="M14.44 0C12.63 0 11.01 0.87998 10 2.22998C8.99 0.87998 7.37 0 5.56 0C2.49 0 0 2.5 0 5.59C0 6.78 0.19 7.87999 0.52 8.89999C2.1 13.9 6.97 16.89 9.38 17.71C9.72 17.83 10.28 17.83 10.62 17.71C13.03 16.89 17.9 13.9 19.48 8.89999C19.81 7.87999 20 6.78 20 5.59C20 2.5 17.51 0 14.44 0Z"
          fill="#7C52A2"
        />
        <Path
          d="M19.77 17.5801L19.01 16.8202C19.41 16.2202 19.64 15.5001 19.64 14.7301C19.64 12.6201 17.93 10.9102 15.82 10.9102C13.71 10.9102 12 12.6201 12 14.7301C12 16.8401 13.71 18.5501 15.82 18.5501C16.59 18.5501 17.31 18.3201 17.91 17.9201L18.67 18.6802C18.82 18.8302 19.02 18.9102 19.22 18.9102C19.42 18.9102 19.62 18.8302 19.77 18.6802C20.08 18.3702 20.08 17.8801 19.77 17.5801Z"
          fill="#7C52A2"
        />
      </G>
    </Svg>
  );
}
