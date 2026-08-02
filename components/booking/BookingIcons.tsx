import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/** Figma booking back chevron (node 2235:1586). */
export function BookingChevronIcon({ size = 24, color = '#6C6C6C' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.90991 19.9201L15.4299 13.4001C16.1999 12.6301 16.1999 11.3701 15.4299 10.6001L8.90991 4.08008"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Figma booking clock (node 2235:1771). */
export function BookingClockIcon({ size = 20, color = '#6C6C6C' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17.97 17.97" fill="none">
      <Path
        d="M17.3167 8.98333C17.3167 13.5833 13.5833 17.3167 8.98333 17.3167C4.38333 17.3167 0.65 13.5833 0.65 8.98333C0.65 4.38333 4.38333 0.65 8.98333 0.65C13.5833 0.65 17.3167 4.38333 17.3167 8.98333Z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.3833 12.875L9.79992 11.3334C9.34992 11.0667 8.98325 10.425 8.98325 9.90003V6.48334"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
