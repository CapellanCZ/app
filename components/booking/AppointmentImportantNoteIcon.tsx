import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/** Figma confirmed-appointment important-note badge (node 2249:422). */
export function AppointmentImportantNoteIcon({ size = 24, color = '#048AF3' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21.4875 21.455" fill="none">
      <Path
        d="M9.495 1.1925C10.195 0.6025 11.325 0.6025 12.005 1.1925L13.585 2.5425C13.885 2.7925 14.455 3.0025 14.855 3.0025H16.555C17.615 3.0025 18.485 3.8725 18.485 4.9325V6.6325C18.485 7.0325 18.695 7.5925 18.945 7.8925L20.295 9.47249C20.885 10.1725 20.885 11.3025 20.295 11.9825L18.945 13.5625C18.695 13.8625 18.485 14.4225 18.485 14.8225V16.5225C18.485 17.5825 17.615 18.4525 16.555 18.4525H14.855C14.455 18.4525 13.895 18.6625 13.595 18.9125L12.015 20.2625C11.315 20.8525 10.185 20.8525 9.505 20.2625L7.92501 18.9125C7.62501 18.6625 7.055 18.4525 6.665 18.4525H4.915C3.855 18.4525 2.985 17.5825 2.985 16.5225V14.8125C2.985 14.4225 2.785 13.8525 2.535 13.5625L1.185 11.9725C0.605 11.2825 0.605 10.1625 1.185 9.47249L2.535 7.8825C2.785 7.5825 2.985 7.0225 2.985 6.6325V4.9425C2.985 3.8825 3.855 3.0125 4.915 3.0125H6.645C7.045 3.0125 7.605 2.8025 7.905 2.5525L9.495 1.1925Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.745 6.87306V11.7031"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.7395 14.7422H10.7485"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
