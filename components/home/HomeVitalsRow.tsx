import { Platform, View, type ViewStyle } from 'react-native';

import { FigmaDropletIcon, FigmaHeartRateIcon } from '@/components/home/FigmaHomeIcons';
import { VitalMetricCard } from '@/components/vitals/VitalMetricCard';
import {
  classifyBloodPressureStatus,
  classifyHeartRateStatus,
  vitalStatusColor,
} from '@/lib/vitals/vitalsStatus';
import { BRAND } from '@/lib/ui/theme';

type Props = {
  bloodPressure?: string | null;
  heartRate?: string | null;
  variant?: 'home' | 'detail';
};

const PASTEL_BLUE = BRAND.soft;
const PASTEL_BLUE_ALT = BRAND.softSurface;

const CARD_SOFT_SHADOW: ViewStyle =
  Platform.OS === 'android'
    ? {
        elevation: 0,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      };

/**
 * Recent vitals — pastel blue cards (not solid brand), dark type, soft elevation.
 */
export function HomeVitalsRow({ bloodPressure, heartRate, variant = 'home' }: Props) {
  const bpStatus = classifyBloodPressureStatus(bloodPressure);
  const hrStatus = classifyHeartRateStatus(heartRate);

  return (
    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
      <View style={[{ flex: 1 }, CARD_SOFT_SHADOW]}>
        <VitalMetricCard
          variant={variant}
          label="Blood Pressure"
          value={bloodPressure?.trim() || '—'}
          status={bpStatus.label}
          statusColor={vitalStatusColor(bpStatus.tone)}
          backgroundColor={PASTEL_BLUE}
          icon={<FigmaDropletIcon size={22} color={BRAND.primary} />}
        />
      </View>
      <View style={[{ flex: 1 }, CARD_SOFT_SHADOW]}>
        <VitalMetricCard
          variant={variant}
          label="Avg. Heart Rate"
          value={heartRate?.trim() || '—'}
          status={hrStatus.label}
          statusColor={vitalStatusColor(hrStatus.tone)}
          backgroundColor={PASTEL_BLUE_ALT}
          icon={<FigmaHeartRateIcon size={22} color={BRAND.primary} />}
        />
      </View>
    </View>
  );
}
