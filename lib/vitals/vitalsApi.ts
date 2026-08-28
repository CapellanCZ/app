import { supabase } from '@/lib/supabase';

export type LatestVitals = {
  bloodPressure: string | null;
  /** Pulse / heart rate display value (e.g. "72 bpm"). */
  heartRate: string | null;
  temperature: string | null;
  weight: string | null;
  height: string | null;
  oxygenSaturation: string | null;
  updatedAt: string | null;
};

type PhysicalExam = {
  bloodPressure?: unknown;
  pulseRate?: unknown;
  temperature?: unknown;
  weight?: unknown;
  height?: unknown;
  oxygenSaturation?: unknown;
  spo2?: unknown;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatHeartRate(pulse: string | null): string | null {
  if (!pulse) return null;
  if (/bpm/i.test(pulse)) return pulse;
  return `${pulse} bpm`;
}

function formatTemperature(value: string | null): string | null {
  if (!value) return null;
  if (/°|celsius|c\b/i.test(value)) return value;
  return `${value}°C`;
}

function formatWeight(value: string | null): string | null {
  if (!value) return null;
  if (/kg|lb/i.test(value)) return value;
  return `${value} kg`;
}

function formatHeight(value: string | null): string | null {
  if (!value) return null;
  if (/cm|m\b|ft|in/i.test(value)) return value;
  return `${value} cm`;
}

function formatOxygen(value: string | null): string | null {
  if (!value) return null;
  if (/%|spo2/i.test(value)) return value.replace(/spo2/i, '%').trim();
  return `${value}%`;
}

/**
 * Latest clinic vitals for the signed-in patient from `patient_records.physical_exam`
 * (bloodPressure + pulseRate), matched by student_id or employee_id.
 */
export async function fetchLatestVitalsForPatient(params: {
  studentId?: string | null;
  employeeId?: string | null;
}): Promise<LatestVitals> {
  const empty: LatestVitals = {
    bloodPressure: null,
    heartRate: null,
    temperature: null,
    weight: null,
    height: null,
    oxygenSaturation: null,
    updatedAt: null,
  };
  if (!supabase) return empty;

  const studentId = params.studentId?.trim() || null;
  const employeeId = params.employeeId?.trim() || null;
  if (!studentId && !employeeId) return empty;

  let query = supabase
    .from('patient_records')
    .select('physical_exam, last_edited_at, updated_at')
    .not('physical_exam', 'is', null)
    .order('last_edited_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(1);

  if (studentId) {
    query = query.eq('student_id', studentId);
  } else if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('[vitals] fetch failed:', error.message);
    throw error;
  }
  if (!data) return empty;

  const exam = (data.physical_exam ?? null) as PhysicalExam | null;
  const bloodPressure = asTrimmedString(exam?.bloodPressure);
  const pulseRate = asTrimmedString(exam?.pulseRate);
  const temperature = formatTemperature(asTrimmedString(exam?.temperature));
  const weight = formatWeight(asTrimmedString(exam?.weight));
  const height = formatHeight(asTrimmedString(exam?.height));
  const oxygenSaturation = formatOxygen(
    asTrimmedString(exam?.oxygenSaturation) ?? asTrimmedString(exam?.spo2),
  );

  if (!bloodPressure && !pulseRate && !temperature && !weight && !height && !oxygenSaturation) {
    return empty;
  }

  return {
    bloodPressure,
    heartRate: formatHeartRate(pulseRate),
    temperature,
    weight,
    height,
    oxygenSaturation,
    updatedAt: data.last_edited_at ?? data.updated_at ?? null,
  };
}
