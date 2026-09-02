import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { ConsultationPrescription, PrescriptionMedication } from './types';

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

  if (!name && !strength && !quantity && !frequency && !duration && !instructions) {
    return null;
  }

  return { name, strength, quantity, frequency, duration, instructions };
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

  return [];
}

function parseConsultationRow(row: Record<string, unknown>): ConsultationPrescription {
  const sources = [
    row.medications,
    row.prescription_medications,
    row.prescription,
    row.prescription_data,
    row.prescription_document,
  ];

  const medications = sources.flatMap((source) => medicationsFromJson(source));
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

/** Patient-safe prescription for a completed appointment consultation. */
export async function fetchConsultationPrescription(
  appointmentId: string,
): Promise<ConsultationPrescription> {
  if (!appointmentId?.trim() || !isSupabaseConfigured || !supabase) return EMPTY;

  const { data, error } = await supabase
    .from('appointment_consultations')
    .select(
      'medications, prescription, prescription_data, prescription_document, prescription_medications, completed_at, updated_at, created_at',
    )
    .eq('appointment_id', appointmentId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[consultation] fetchConsultationPrescription:', error.message);
    return EMPTY;
  }

  if (!data) return EMPTY;
  return parseConsultationRow(data as Record<string, unknown>);
}
