import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/** Figma medical records chevron (node 2230:1317). */
export function FigmaHistoryChevronIcon({ size = 24, color = '#6C6C6C' }: Props) {
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

/** Figma medical records calendar+ icon (node 2230:1297). */
export function FigmaHistoryCalendarIcon({ size = 20, color = '#3F3F3F' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17.13 18.8" fill="none">
      <Path
        d="M4.81667 0.65V3.15"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.4833 0.65V3.15"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1.06667 6.5582H15.2333"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.15 18.15C14.9909 18.15 16.4833 16.6576 16.4833 14.8167C16.4833 12.9757 14.9909 11.4833 13.15 11.4833C11.3091 11.4833 9.81667 12.9757 9.81667 14.8167C9.81667 16.6576 11.3091 18.15 13.15 18.15Z"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.3917 14.859H11.9083"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.15 13.6415V16.1332"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.65 6.06667V12.6167C15.0417 11.925 14.15 11.4833 13.15 11.4833C11.3083 11.4833 9.81667 12.975 9.81667 14.8167C9.81667 15.4417 9.99167 16.0333 10.3 16.5333C10.475 16.8333 10.7 17.1 10.9583 17.3167H4.81667C1.9 17.3167 0.65 15.65 0.65 13.15V6.06667C0.65 3.56667 1.9 1.9 4.81667 1.9H11.4833C14.4 1.9 15.65 3.56667 15.65 6.06667Z"
        stroke={color}
        strokeWidth={1.3}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.14625 10.3993H8.15375"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.06192 10.3993H5.06941"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.06192 12.8993H5.06941"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Figma medical records reason / user-search icon (node 2230:1271). */
export function FigmaHistoryReasonIcon({ size = 20, color = '#3F3F3F' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16.99 18.17" fill="none">
      <Path
        d="M7.9082 9.08333C10.2094 9.08333 12.0749 7.21785 12.0749 4.91667C12.0749 2.61548 10.2094 0.75 7.9082 0.75C5.60702 0.75 3.74153 2.61548 3.74153 4.91667C3.74153 7.21785 5.60702 9.08333 7.9082 9.08333Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M0.75 17.4167C0.75 14.1917 3.95835 11.5833 7.90837 11.5833"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.0749 16.9167C14.5476 16.9167 15.7415 15.7228 15.7415 14.25C15.7415 12.7773 14.5476 11.5833 13.0749 11.5833C11.6021 11.5833 10.4082 12.7773 10.4082 14.25C10.4082 15.7228 11.6021 16.9167 13.0749 16.9167Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.2415 17.4167L15.4082 16.5833"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
