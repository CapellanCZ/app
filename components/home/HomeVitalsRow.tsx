import { View } from 'react-native';

import { FigmaDropletIcon, FigmaHeartRateIcon } from '@/components/home/FigmaHomeIcons';
import { VitalMetricCard } from '@/components/vitals/VitalMetricCard';
import {
  classifyBloodPressureStatus,
  classifyHeartRateStatus,
  vitalStatusColor,
} from '@/lib/vitals/vitalsStatus';

type Props = {
  bloodPressure?: string | null;
  heartRate?: string | null;
  variant?: 'home' | 'detail';
};

/**
 * Figma "Your Vitals" dual cards. Status from clinic ranges (AHA BP / resting HR).
 */
export function HomeVitalsRow({ bloodPressure, heartRate, variant = 'home' }: Props) {
  const bpStatus = classifyBloodPressureStatus(bloodPressure);
  const hrStatus = classifyHeartRateStatus(heartRate);

  return (
    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
      <VitalMetricCard
        variant={variant}
        label="Blood Pressure"
        value={bloodPressure?.trim() || '—'}
        status={bpStatus.label}
        statusColor={vitalStatusColor(bpStatus.tone)}
        backgroundColor="#F4EDD6"
        icon={<FigmaDropletIcon size={22} />}
      />
      <VitalMetricCard
        variant={variant}
        label="Avg. Heart Rate"
        value={heartRate?.trim() || '—'}
        status={hrStatus.label}
        statusColor={vitalStatusColor(hrStatus.tone)}
        backgroundColor="#F4E2FC"
        icon={<FigmaHeartRateIcon size={22} />}
      />
    </View>
  );
}
