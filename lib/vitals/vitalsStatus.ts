/**
 * Adult vital-sign status helpers (clinic home cards).
 * BP categories follow AHA/ACC adult guidance; resting HR uses 60–100 bpm.
 * Informational only — not a diagnosis.
 */

export type VitalStatusTone = 'neutral' | 'good' | 'watch' | 'alert';

export type VitalStatus = {
  label: string;
  tone: VitalStatusTone;
};

const NO_READING: VitalStatus = { label: 'No recent reading', tone: 'neutral' };

function parseBloodPressure(raw: string): { systolic: number; diastolic: number } | null {
  const match = raw.trim().match(/^(\d{2,3})\s*[\/\-]\s*(\d{2,3})$/);
  if (!match) return null;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return null;
  if (systolic < 40 || systolic > 300 || diastolic < 20 || diastolic > 200) return null;
  return { systolic, diastolic };
}

function parseHeartRate(raw: string): number | null {
  const match = raw.trim().match(/(\d{2,3})/);
  if (!match) return null;
  const bpm = Number(match[1]);
  if (!Number.isFinite(bpm) || bpm < 20 || bpm > 250) return null;
  return bpm;
}

/**
 * Classify clinic BP reading (e.g. "120/80").
 * Low: systolic &lt; 90 or diastolic &lt; 60.
 */
export function classifyBloodPressureStatus(raw: string | null | undefined): VitalStatus {
  if (!raw?.trim()) return NO_READING;
  const bp = parseBloodPressure(raw);
  if (!bp) return { label: 'Check reading', tone: 'watch' };

  const { systolic, diastolic } = bp;

  if (systolic > 180 || diastolic > 120) {
    return { label: 'Seek care', tone: 'alert' };
  }
  if (systolic < 90 || diastolic < 60) {
    return { label: 'Low', tone: 'watch' };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { label: 'High', tone: 'alert' };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { label: 'High', tone: 'alert' };
  }
  if (systolic >= 120 && diastolic < 80) {
    return { label: 'Elevated', tone: 'watch' };
  }
  // &lt; 120 and &lt; 80
  return { label: 'Good', tone: 'good' };
}

/** Classify resting pulse (e.g. "72" or "72 bpm"). */
export function classifyHeartRateStatus(raw: string | null | undefined): VitalStatus {
  if (!raw?.trim()) return NO_READING;
  const bpm = parseHeartRate(raw);
  if (bpm == null) return { label: 'Check reading', tone: 'watch' };

  if (bpm < 60) return { label: 'Low', tone: 'watch' };
  if (bpm > 100) return { label: 'High', tone: 'alert' };
  return { label: 'Good', tone: 'good' };
}

export function vitalStatusColor(tone: VitalStatusTone): string {
  switch (tone) {
    case 'good':
      return '#1B7A3D';
    case 'watch':
      return '#9A6B00';
    case 'alert':
      return '#B42318';
    default:
      return '#373636';
  }
}
