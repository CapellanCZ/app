import { View, type StyleProp, type ViewStyle } from 'react-native';

import {
  getDoctorPresenceDotMeta,
  type DoctorPresenceDotStatus,
} from '@/lib/health-service/staffPresenceDot';

type Props = {
  status: DoctorPresenceDotStatus;
  /** Outer diameter including border. Default 12. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Status circle for a doctor avatar — Active (green) · On break (amber) · Offline (grey).
 * Position with absolute styles at the avatar’s bottom-right.
 */
export function StaffPresenceDot({ status, size = 12, style }: Props) {
  const meta = getDoctorPresenceDotMeta(status);
  const border = Math.max(1.5, size * 0.18);
  const inner = Math.max(4, size - border * 2);

  return (
    <View
      accessibilityLabel={meta.label}
      accessibilityRole="text"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: meta.color,
          shadowColor: meta.glow ? meta.color : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: meta.glow ? 0.55 : 0,
          shadowRadius: meta.glow ? 5 : 0,
          elevation: meta.glow ? 3 : 0,
        }}
      />
    </View>
  );
}
