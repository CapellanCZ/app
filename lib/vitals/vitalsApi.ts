import { supabase } from '@/lib/supabase';

export type LatestVitals = {
  bloodPressure: string | null;
  /** Pulse / heart rate display value (e.g. "72 bpm"). */
  heartRate: string | null;
  updatedAt: string | null;
};

type PhysicalExam = {
  bloodPressure?: unknown;
  pulseRate?: unknown;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatHeartRate(pulse: string | null): string | null {
  if (!pulse) return null;
  // Already labeled in clinic data.
  if (/bpm/i.test(pulse)) return pulse;
  return `${pulse} bpm`;
}

/**
 * Latest clinic vitals for the signed-in patient from `patient_records.physical_exam`
 * (bloodPressure + pulseRate), matched by student_id or employee_id.
 */
export async function fetchLatestVitalsForPatient(params: {
  studentId?: string | null;
  employeeId?: string | null;
}): Promise<LatestVitals> {
  const empty: LatestVitals = { bloodPressure: null, heartRate: null, updatedAt: null };
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

  if (!bloodPressure && !pulseRate) return empty;

  return {
    bloodPressure,
    heartRate: formatHeartRate(pulseRate),
    updatedAt: data.last_edited_at ?? data.updated_at ?? null,
  };
}
