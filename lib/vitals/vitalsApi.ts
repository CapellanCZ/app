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

export const EMPTY_VITALS: LatestVitals = {
  bloodPressure: null,
  heartRate: null,
  temperature: null,
  weight: null,
  height: null,
  oxygenSaturation: null,
  updatedAt: null,
};

type PhysicalExam = {
  bloodPressure?: unknown;
  pulseRate?: unknown;
  heartRate?: unknown;
  temperature?: unknown;
  weight?: unknown;
  height?: unknown;
  oxygenSaturation?: unknown;
  spo2?: unknown;
  o2?: unknown;
};

type PhysicalExamRecord = {
  physical_exam?: unknown;
  last_edited_at?: string | null;
  updated_at?: string | null;
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

function hasAnyVitalValue(vitals: LatestVitals): boolean {
  return Boolean(
    vitals.bloodPressure?.trim() ||
      vitals.heartRate?.trim() ||
      vitals.temperature?.trim() ||
      vitals.weight?.trim() ||
      vitals.height?.trim() ||
      vitals.oxygenSaturation?.trim(),
  );
}

function mapPhysicalExam(
  exam: PhysicalExam | null | undefined,
  updatedAt: string | null,
): LatestVitals {
  const bloodPressure = asTrimmedString(exam?.bloodPressure);
  const pulseRate =
    asTrimmedString(exam?.pulseRate) ?? asTrimmedString(exam?.heartRate);
  const temperature = formatTemperature(asTrimmedString(exam?.temperature));
  const weight = formatWeight(asTrimmedString(exam?.weight));
  const height = formatHeight(asTrimmedString(exam?.height));
  const oxygenSaturation = formatOxygen(
    asTrimmedString(exam?.oxygenSaturation) ??
      asTrimmedString(exam?.spo2) ??
      asTrimmedString(exam?.o2),
  );

  const vitals: LatestVitals = {
    bloodPressure,
    heartRate: formatHeartRate(pulseRate),
    temperature,
    weight,
    height,
    oxygenSaturation,
    updatedAt,
  };

  return hasAnyVitalValue(vitals) ? vitals : EMPTY_VITALS;
}

function mapPhysicalExamRecord(record: PhysicalExamRecord): LatestVitals {
  const exam = (record.physical_exam ?? null) as PhysicalExam | null;
  const updatedAt = record.last_edited_at ?? record.updated_at ?? null;
  return mapPhysicalExam(exam, updatedAt);
}

const CLINIC_TZ = 'Asia/Manila';

function dateKeyInClinicTz(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function vitalsMatchServiceDate(vitals: LatestVitals, serviceDate: string | null | undefined): boolean {
  if (!serviceDate?.trim()) return true;
  if (!vitals.updatedAt) return false;
  return dateKeyInClinicTz(vitals.updatedAt) === serviceDate.trim();
}

async function fetchPatientRecordVitals(params: {
  studentId?: string | null;
  employeeId?: string | null;
  serviceDate?: string | null;
  throwOnError?: boolean;
}): Promise<LatestVitals> {
  if (!supabase) return EMPTY_VITALS;

  const studentId = params.studentId?.trim() || null;
  const employeeId = params.employeeId?.trim() || null;
  if (!studentId && !employeeId) return EMPTY_VITALS;

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
    if (params.throwOnError) {
      console.error('[vitals] fetch failed:', error.message);
      throw error;
    }
    console.warn('[vitals] patient_records:', error.message);
    return EMPTY_VITALS;
  }
  if (!data) return EMPTY_VITALS;

  const mapped = mapPhysicalExamRecord(data as PhysicalExamRecord);
  if (!hasAnyVitalValue(mapped)) return EMPTY_VITALS;
  if (!vitalsMatchServiceDate(mapped, params.serviceDate)) return EMPTY_VITALS;
  return mapped;
}

export async function fetchLatestVitalsForPatient(params: {
  studentId?: string | null;
  employeeId?: string | null;
}): Promise<LatestVitals> {
  return fetchPatientRecordVitals({ ...params, throwOnError: true });
}

/**
 * Vitals for a completed appointment (consultation summary).
 * Uses same-day `patient_records.physical_exam` (live DB has no health_vital_signs /
 * patient_records.appointment_id).
 */
export async function fetchVitalsForAppointment(params: {
  appointmentId: string;
  studentId?: string | null;
  employeeId?: string | null;
  /** Visit date (`YYYY-MM-DD`, clinic timezone) for patient-record fallback. */
  serviceDate?: string | null;
}): Promise<LatestVitals> {
  const appointmentId = params.appointmentId?.trim();
  if (!supabase || !appointmentId) return EMPTY_VITALS;

  return fetchPatientRecordVitals({
    studentId: params.studentId,
    employeeId: params.employeeId,
    serviceDate: params.serviceDate,
  });
}
