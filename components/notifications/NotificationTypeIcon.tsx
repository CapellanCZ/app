import Svg, { Path } from 'react-native-svg';
import { View } from 'react-native';

import {
  NOTIFICATION_STATUS_STYLE,
} from '@/lib/notifications/resolveNotificationStatus';
import type { NotificationStatusType } from '@/lib/notifications/types';

type Props = {
  variant?: NotificationStatusType;
  size?: number;
};

function InfoGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 21.5 21.5" fill="none">
      <Path
        d="M10.75 20.75C16.25 20.75 20.75 16.25 20.75 10.75C20.75 5.25 16.25 0.75 10.75 0.75C5.25 0.75 0.75 5.25 0.75 10.75C0.75 16.25 5.25 20.75 10.75 20.75Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.75 6.75V11.75"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.7445 14.75H10.7535"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SuccessGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 21.5 21.5" fill="none">
      <Path
        d="M10.75 21.5C4.82 21.5 0 16.68 0 10.75C0 4.82 4.82 0 10.75 0C16.68 0 21.5 4.82 21.5 10.75C21.5 16.68 16.68 21.5 10.75 21.5ZM10.75 1.5C5.65 1.5 1.5 5.65 1.5 10.75C1.5 15.85 5.65 20 10.75 20C15.85 20 20 15.85 20 10.75C20 5.65 15.85 1.5 10.75 1.5Z"
        fill={color}
      />
      <Path
        d="M9.3299 14.3296C9.1299 14.3296 8.9399 14.2496 8.7999 14.1096L5.96994 11.2796C5.67994 10.9896 5.67994 10.5096 5.96994 10.2196C6.25994 9.9296 6.73994 9.9296 7.02994 10.2196L9.3299 12.5196L14.4699 7.37961C14.7599 7.08961 15.2399 7.08961 15.5299 7.37961C15.8199 7.66961 15.8199 8.14961 15.5299 8.43961L9.8599 14.1096C9.7199 14.2496 9.5299 14.3296 9.3299 14.3296Z"
        fill={color}
      />
    </Svg>
  );
}

function WarningGlyph() {
  return (
    <Svg width={16} height={20} viewBox="0 0 15.3836 20" fill="none">
      <Path
        d="M15.0294 12.49L14.0294 10.83C13.8194 10.46 13.6294 9.76 13.6294 9.35V6.82C13.6294 4.47 12.2494 2.44 10.2594 1.49C9.73936 0.57 8.77936 0 7.67936 0C6.58936 0 5.6094 0.59 5.0894 1.52C3.1394 2.49 1.7894 4.5 1.7894 6.82V9.35C1.7894 9.76 1.5994 10.46 1.3894 10.82L0.379396 12.49C-0.0206042 13.16 -0.110604 13.9 0.139396 14.58C0.379396 15.25 0.949396 15.77 1.6894 16.02C3.6294 16.68 5.6694 17 7.70936 17C9.74936 17 11.7894 16.68 13.7294 16.03C14.4294 15.8 14.9694 15.27 15.2294 14.58C15.4894 13.89 15.4194 13.13 15.0294 12.49Z"
        fill="#7E6B28"
      />
      <Path
        d="M10.5194 18.01C10.0994 19.17 8.98936 20 7.68936 20C6.89936 20 6.11936 19.68 5.56939 19.11C5.24939 18.81 5.00939 18.41 4.86939 18C4.99939 18.02 5.12939 18.03 5.26939 18.05C5.49939 18.08 5.73936 18.11 5.97936 18.13C6.54936 18.18 7.12936 18.21 7.70936 18.21C8.27936 18.21 8.84936 18.18 9.40936 18.13C9.61936 18.11 9.82936 18.1 10.0294 18.07C10.1894 18.05 10.3494 18.03 10.5194 18.01Z"
        fill="#7C52A2"
      />
    </Svg>
  );
}

/** Figma 2260:1171 — cancelled / error calendar. */
function ErrorGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={22} viewBox="0 0 19.5 21.5" fill="none">
      <Path
        d="M5.75 0.75V3.75"
        stroke={color}
        strokeWidth="1.5"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.75 0.75V3.75"
        stroke={color}
        strokeWidth="1.5"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1.25 7.83984H18.25"
        stroke={color}
        strokeWidth="1.5"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.75 7.25V15.75C18.75 18.75 17.25 20.75 13.75 20.75H5.75C2.25 20.75 0.75 18.75 0.75 15.75V7.25C0.75 4.25 2.25 2.25 5.75 2.25H13.75C17.25 2.25 18.75 4.25 18.75 7.25Z"
        stroke={color}
        strokeWidth="1.5"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.4447 12.4492H13.4537" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M13.4447 15.4492H13.4537" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9.7455 12.4492H9.7545" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9.7455 15.4492H9.7545" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M6.04431 12.4492H6.05329" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M6.04431 15.4492H6.05329" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Status glyph wells — Figma info / success / warning / cancelled.
 */
export function NotificationTypeIcon({ variant = 'info', size = 44 }: Props) {
  const tokens = NOTIFICATION_STATUS_STYLE[variant] ?? NOTIFICATION_STATUS_STYLE.info;

  let glyph;
  switch (variant) {
    case 'success':
      glyph = <SuccessGlyph color={tokens.accent} />;
      break;
    case 'warning':
      glyph = <WarningGlyph />;
      break;
    case 'error':
      glyph = <ErrorGlyph color={tokens.accent} />;
      break;
    case 'info':
    default:
      glyph = <InfoGlyph color={tokens.accent} />;
      break;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: tokens.well,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
      {glyph}
    </View>
  );
}
