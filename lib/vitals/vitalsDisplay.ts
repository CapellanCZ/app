import type { LatestVitals } from '@/lib/vitals/vitalsApi';

const UPDATED_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function hasVitalsReadings(vitals: LatestVitals): boolean {
  return Boolean(
    vitals.bloodPressure?.trim() ||
      vitals.heartRate?.trim() ||
      vitals.temperature?.trim() ||
      vitals.weight?.trim() ||
      vitals.height?.trim() ||
      vitals.oxygenSaturation?.trim(),
  );
}

export function formatVitalsUpdatedAt(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return UPDATED_FORMATTER.format(date);
}

export type VitalsMeasurementRow = {
  label: string;
  value: string;
};

const EMPTY_VALUE = '—';

export function buildVitalsGridRows(vitals: LatestVitals): VitalsMeasurementRow[] {
  return [
    { label: 'Blood Pressure', value: vitals.bloodPressure?.trim() || EMPTY_VALUE },
    { label: 'Pulse Rate', value: vitals.heartRate?.trim() || EMPTY_VALUE },
    { label: 'Temperature', value: vitals.temperature?.trim() || EMPTY_VALUE },
    { label: 'Weight', value: vitals.weight?.trim() || EMPTY_VALUE },
    { label: 'Height', value: vitals.height?.trim() || EMPTY_VALUE },
    { label: 'O2', value: vitals.oxygenSaturation?.trim() || EMPTY_VALUE },
  ];
}

export function buildSecondaryMeasurements(vitals: LatestVitals): VitalsMeasurementRow[] {
  const rows: VitalsMeasurementRow[] = [];

  if (vitals.temperature?.trim()) {
    rows.push({ label: 'Temperature', value: vitals.temperature.trim() });
  }
  if (vitals.oxygenSaturation?.trim()) {
    rows.push({ label: 'Oxygen saturation', value: vitals.oxygenSaturation.trim() });
  }
  if (vitals.weight?.trim()) {
    rows.push({ label: 'Weight', value: vitals.weight.trim() });
  }
  if (vitals.height?.trim()) {
    rows.push({ label: 'Height', value: vitals.height.trim() });
  }

  return rows;
}
