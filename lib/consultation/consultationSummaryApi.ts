import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import { formatDiagnosticRequestLines } from './diagnosticRequestLabels';
import type {
  ConsultationPrescription,
  IssuedPrescriptionDocument,
  PrescriptionDiagnosticRequests,
  PrescriptionMedication,
} from './types';

const EMPTY: ConsultationPrescription = { medications: [], updatedAt: null };

function asTrimmed(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapMedication(raw: unknown): PrescriptionMedication | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;

  const name =
    asTrimmed(row.name) ??
    asTrimmed(row.drugName) ??
    asTrimmed(row.drug_name) ??
    asTrimmed(row.medicationName);

  const strength = asTrimmed(row.strength) ?? asTrimmed(row.dose);
  const quantity = asTrimmed(row.quantity) ?? asTrimmed(row.qty);
  const frequency = asTrimmed(row.frequency);
  const duration = asTrimmed(row.duration);
  const instructions =
    asTrimmed(row.instructions) ?? asTrimmed(row.instruction) ?? asTrimmed(row.notes);
  const route = asTrimmed(row.route);

  if (!name && !strength && !quantity && !frequency && !duration && !instructions) {
    return null;
  }

  return { name, strength, quantity, frequency, duration, instructions, route };
}

function medicationsFromJson(value: unknown): PrescriptionMedication[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(mapMedication).filter((item): item is PrescriptionMedication => item != null);
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const nested =
      obj.medications ?? obj.items ?? obj.drugs ?? obj.prescription_medications ?? obj.prescriptionMedications;

    if (nested) return medicationsFromJson(nested);

    const single = mapMedication(obj);
    return single ? [single] : [];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return medicationsFromJson(JSON.parse(trimmed) as unknown);
      } catch {
        // Fall through to plain-text note.
      }
    }

    return [
      {
        name: trimmed,
        strength: null,
        quantity: null,
        frequency: null,
        duration: null,
        instructions: null,
      },
    ];
  }

  return [];
}

function parseConsultationRow(row: Record<string, unknown>): ConsultationPrescription {
  const medications = medicationsFromJson(row.prescription);
  const deduped = medications.filter((med, index) => {
    const key = JSON.stringify(med);
    return medications.findIndex((other) => JSON.stringify(other) === key) === index;
  });

  const updatedAt =
    asTrimmed(row.completed_at) ??
    asTrimmed(row.updated_at) ??
    asTrimmed(row.created_at);

  return { medications: deduped, updatedAt };
}

/**
 * Patient-safe prescription for an appointment.
 * Reads `consultations.prescription` — legacy fallback when no issued document exists.
 */
export async function fetchConsultationPrescription(
  appointmentId: string,
): Promise<ConsultationPrescription> {
  if (!appointmentId?.trim() || !isSupabaseConfigured || !supabase) return EMPTY;

  const { data, error } = await supabase
    .from('consultations')
    .select('prescription, updated_at, created_at')
    .eq('appointment_id', appointmentId)
    .not('prescription', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[consultation] fetchConsultationPrescription:', error.message);
    return EMPTY;
  }

  if (!data) return EMPTY;
  return parseConsultationRow(data as Record<string, unknown>);
}

type MedicalCertRow = {
  id: string;
  certificate_number: string;
  doctor_name: string | null;
  issued_at: string | null;
  status: string;
  document_file_url: string | null;
  payload: Record<string, unknown> | null;
  patients:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

function patientNameFromJoin(
  patients: MedicalCertRow['patients'],
): string {
  if (!patients) return '—';
  if (Array.isArray(patients)) return patients[0]?.full_name?.trim() || '—';
  return patients.full_name?.trim() || '—';
}

function mapIssuedDocument(row: MedicalCertRow): IssuedPrescriptionDocument {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const medications = medicationsFromJson(payload.medications ?? payload);
  const diagnosticRaw = payload.diagnosticRequests as PrescriptionDiagnosticRequests | undefined;
  const diagnosticLines = formatDiagnosticRequestLines(diagnosticRaw);

  return {
    id: row.id,
    documentNumber: row.certificate_number,
    doctorName: asTrimmed(row.doctor_name),
    licenseNumber:
      asTrimmed(payload.physicianLicenseNumber) ?? asTrimmed(payload.licenseNumber),
    issuedAt: asTrimmed(row.issued_at),
    patientFullName: patientNameFromJoin(row.patients),
    patientAddress: asTrimmed(payload.patientAddress),
    patientAge: asTrimmed(payload.patientAge),
    patientSex: asTrimmed(payload.patientSex),
    medications,
    diagnosticLines,
    documentFileUrl: asTrimmed(row.document_file_url),
    status: row.status,
  };
}

/**
 * Official issued prescription document for an appointment (web source of truth).
 * Reads medical_certificates where document_type = prescription and status issued/printed.
 */
export async function fetchIssuedPrescriptionDocument(
  appointmentId: string,
): Promise<IssuedPrescriptionDocument | null> {
  if (!appointmentId?.trim() || !isSupabaseConfigured || !supabase) return null;

  const { data: consultation, error: consultError } = await supabase
    .from('consultations')
    .select('id')
    .eq('appointment_id', appointmentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (consultError) {
    console.warn('[consultation] fetchIssuedPrescriptionDocument consult:', consultError.message);
    return null;
  }

  if (!consultation?.id) return null;

  const { data, error } = await supabase
    .from('medical_certificates')
    .select(
      `
      id,
      certificate_number,
      doctor_name,
      issued_at,
      status,
      document_file_url,
      payload,
      patients ( full_name )
    `,
    )
    .eq('consultation_id', consultation.id)
    .eq('document_type', 'prescription')
    .in('status', ['issued', 'printed'])
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[consultation] fetchIssuedPrescriptionDocument:', error.message);
    return null;
  }

  if (!data) return null;
  return mapIssuedDocument(data as MedicalCertRow);
}
