import { specialtyLabelForProviderType } from '@/lib/health-service/appointmentStaff';
import type { QueueTicket } from '@/lib/health-service/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { PatientQueueView } from './types';

const CLINIC_TZ = 'Asia/Manila';

function todayServiceDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function labelFromIso(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(iso));
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '12';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? 'AM';
  return `${hour}:${minute} ${period.toUpperCase()}`;
}

function mapQueueTicketRow(row: {
  ticket_code?: string | null;
  queue_position?: number | null;
  queue_number?: number | null;
  estimated_wait_minutes?: number | null;
  status?: string | null;
}): QueueTicket | null {
  const position =
    typeof row.queue_number === 'number'
      ? row.queue_number
      : typeof row.queue_position === 'number'
        ? row.queue_position
        : null;
  if (position == null) return null;

  const statusRaw = String(row.status ?? 'idle');
  const status: QueueTicket['status'] =
    statusRaw === 'waiting' || statusRaw === 'called' || statusRaw === 'idle'
      ? statusRaw
      : statusRaw === 'checked_in'
        ? 'waiting'
        : 'idle';

  return {
    code: String(row.ticket_code ?? `${position}#`),
    position,
    estimatedMinutes: Number(row.estimated_wait_minutes ?? 0),
    status: statusRaw === 'called' ? 'called' : status,
  };
}

type QueueRow = {
  id: string;
  ticket_code: string | null;
  queue_position: number | null;
  queue_number: number | null;
  estimated_wait_minutes: number | null;
  status: string | null;
  station: string | null;
  service_date: string | null;
  appointment_id: string | null;
  appointments: {
    id: string;
    starts_at: string | null;
    doctor_id: string | null;
    provider_type: string | null;
    doctor?: { full_name: string | null } | null;
  } | null;
};

type QueueRowRaw = Omit<QueueRow, 'appointments'> & {
  appointments: QueueRow['appointments'] | NonNullable<QueueRow['appointments']>[] | null;
};

function normalizeQueueRow(raw: QueueRowRaw): QueueRow {
  const appointments = Array.isArray(raw.appointments)
    ? (raw.appointments[0] ?? null)
    : raw.appointments;

  return { ...raw, appointments };
}

function mapQueueView(row: QueueRow): PatientQueueView | null {
  const ticket = mapQueueTicketRow(row);
  if (!ticket) return null;

  const appt = row.appointments;
  const staffName = appt?.doctor?.full_name?.trim() || null;
  const staffSpecialty = specialtyLabelForProviderType(appt?.provider_type ?? null);

  return {
    ticketId: row.id,
    ticket,
    station: row.station?.trim() || null,
    serviceDate: row.service_date ?? todayServiceDate(),
    appointmentId: row.appointment_id ?? appt?.id ?? null,
    appointmentTimeLabel: appt?.starts_at ? labelFromIso(appt.starts_at) : null,
    staffName: staffName || null,
    staffSpecialty: staffSpecialty || null,
  };
}

/** Today's active clinic queue ticket for the signed-in patient, if any. */
export async function fetchPatientActiveQueue(patientId: string): Promise<PatientQueueView | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const serviceDate = todayServiceDate();

  const { data, error } = await supabase
    .from('health_queue_tickets')
    .select(
      `
      id,
      ticket_code,
      queue_position,
      queue_number,
      estimated_wait_minutes,
      status,
      station,
      service_date,
      appointment_id,
      appointments (
        id,
        starts_at,
        doctor_id,
        provider_type,
        doctor:users!appointments_doctor_id_fkey ( full_name )
      )
    `,
    )
    .eq('patient_id', patientId)
    .eq('service_date', serviceDate)
    .in('status', ['waiting', 'called', 'checked_in', 'idle'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[queue] fetchPatientActiveQueue:', error.message);
    return null;
  }

  if (!data) return null;
  return mapQueueView(normalizeQueueRow(data as QueueRowRaw));
}

export function queueStatusLabel(status: QueueTicket['status']): string {
  switch (status) {
    case 'called':
      return "It's your turn";
    case 'waiting':
      return 'Waiting';
    case 'idle':
    default:
      return 'In queue';
  }
}

export function formatStationLabel(station: string | null): string {
  if (!station?.trim()) return 'Campus clinic';
  const value = station.trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
