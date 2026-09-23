import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Inter } from '@/lib/typography/inter';

/** Exact Figma tokens from node 4203:134 / 4203:142. */
const FIGMA_PRIVACY = {
  background: 'rgba(211, 233, 250, 0.35)',
  border: '#FFFFFF',
  ink: '#048AF3',
} as const;

const DEFAULT_COPY = 'Your data is secure and only visible to you.';

type Props = {
  message?: string;
};

/**
 * Figma privacy check badge (exported path, fill #048AF3).
 * Source: CampusCare Figma asset for 4203:139.
 */
function PrivacyCheckIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M19.555 8.74245L18.195 7.1625C17.935 6.8625 17.725 6.3025 17.725 5.9025V4.2025C17.725 3.1425 16.855 2.2725 15.795 2.2725H14.095C13.705 2.2725 13.135 2.0625 12.835 1.8025L11.255 0.4425C10.565 -0.1475 9.43502 -0.1475 8.73502 0.4425L7.165 1.8125C6.865 2.0625 6.295 2.2725 5.905 2.2725H4.175C3.115 2.2725 2.245 3.1425 2.245 4.2025V5.9125C2.245 6.3025 2.035 6.8625 1.785 7.1625L0.435 8.75245C-0.145 9.44245 -0.145 10.5624 0.435 11.2524L1.785 12.8425C2.035 13.1425 2.245 13.7025 2.245 14.0925V15.8025C2.245 16.8625 3.115 17.7324 4.175 17.7324H5.905C6.295 17.7324 6.865 17.9424 7.165 18.2024L8.74502 19.5624C9.43502 20.1524 10.565 20.1524 11.265 19.5624L12.845 18.2024C13.145 17.9424 13.705 17.7324 14.105 17.7324H15.805C16.865 17.7324 17.735 16.8625 17.735 15.8025V14.1025C17.735 13.7125 17.945 13.1425 18.205 12.8425L19.565 11.2625C20.145 10.5725 20.145 9.43245 19.555 8.74245ZM14.155 8.11245L9.32502 12.9425C9.18502 13.0825 8.99502 13.1624 8.79502 13.1624C8.59502 13.1624 8.40502 13.0825 8.26502 12.9425L5.845 10.5225C5.555 10.2325 5.555 9.75245 5.845 9.46245C6.135 9.17245 6.615 9.17245 6.905 9.46245L8.79502 11.3525L13.095 7.0525C13.385 6.7625 13.865 6.7625 14.155 7.0525C14.445 7.3425 14.445 7.8225 14.155 8.11245Z"
        fill={FIGMA_PRIVACY.ink}
      />
    </Svg>
  );
}

/**
 * Soft blue privacy note — Figma 4203:134 exact colors.
 */
export function AppointmentsPrivacyBanner({ message = DEFAULT_COPY }: Props) {
  return (
    <View
      style={styles.banner}
      accessible
      accessibilityRole="text"
      accessibilityLabel={message}>
      <PrivacyCheckIcon size={20} />
      <Text style={styles.copy}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: FIGMA_PRIVACY.background,
    borderWidth: 1,
    borderColor: FIGMA_PRIVACY.border,
    width: '100%',
  },
  copy: {
    flex: 1,
    fontFamily: Inter.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.56,
    color: FIGMA_PRIVACY.ink,
  },
});
