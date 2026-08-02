/**
 * API-shaped surface for Health Service data with Supabase backend integration.
 * CampusCare live tables: `patients`, `appointments`, `doctor_availability`, `users`.
 */
import { supabase } from '../supabase';
import type { Appointment, AppointmentStatus, SlotPeriod, Staff, StaffRole, QueueTicket } from './types';

const CLINIC_TZ = 'Asia/Manila';

function dateKey(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Calendar date in clinic timezone (YYYY-MM-DD). */
function dateKeyInClinicTz(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function timeFromLabel(label: string): string {
  // Convert "10:40 AM" to "10:40:00"
  const [time, period] = label.split(' ');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours, 10);

  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
}

function labelFromTime(time: string): string {
  // Convert "10:40:00" to "10:40 AM"
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${period}`;
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

/** Build timestamptz for a clinic-local date + "10:40 AM" label. */
function startsAtFromDayAndLabel(day: Date, startLabel: string): Date {
  const key = dateKey(day);
  const time = timeFromLabel(startLabel); // HH:mm:ss
  // Interpret as Asia/Manila wall time via offset approximation using Intl
  const provisional = new Date(`${key}T${time}+08:00`);
  return provisional;
}

function mapDbStatus(status: string): AppointmentStatus {
  if (status === 'cancelled' || status === 'no_show') return 'cancelled';
  if (status === 'pending') return 'pending';
  if (status === 'completed') return 'completed';
  // confirmed | rescheduled | in_progress
  return 'confirmed';
}

async function requireLinkedPatient(): Promise<{
  userId: string;
  patientId: string;
  clinicId: string;
}> {
  if (!supabase) throw new Error('Supabase not configured');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, clinic_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!patient) throw new Error('Patient not found');

  return {
    userId: user.id,
    patientId: patient.id as string,
    clinicId: patient.clinic_id as string,
  };
}

export type HealthServiceApi = {
  listStaff(): Promise<Staff[]>;
  getOpenSlotLabels(staffId: string, day: Date, period: SlotPeriod): Promise<string[]>;
  isWorking(staffId: string, day: Date): Promise<boolean>;
  /** Pending + confirmed; excludes cancelled. */
  listMyAppointments(): Promise<Appointment[]>;
  bookAppointment(input: { staffId: string; day: Date; startLabel: string; symptoms?: string }): Promise<{ id: string; checkInCode: string; createdAt: string }>;
  cancelAppointment(id: string): Promise<void>;
  /** Provider approves a pending booking; ticket is NOT created automatically. */
  confirmAppointmentByProvider(id: string): Promise<void>;
  /** Get current queue tickets */
  getActiveTickets(): Promise<QueueTicket[]>;
  /** Admin: Generate ticket for appointment (creates ticket code and patient number) */
  generateTicketForAppointment(appointmentId: string): Promise<{ success: boolean; ticketCode: string | null; queuePosition: number | null; estimatedWaitMinutes: number | null; expiresAt: string | null }>;
  /** Admin: Check in patient with ticket code */
  checkInPatient(ticketCode: string): Promise<{ success: boolean; appointment?: Appointment }>;
  /** Admin: Record vital signs */
  recordVitalSigns(input: {
    appointmentId: string;
    ticketId: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
    notes?: string;
  }): Promise<void>;
  /** Expire old tickets (cleanup function) */
  expireOldTickets(): Promise<number>;
};

function mapWebRoleToStaffRole(role: string): StaffRole | null {
  if (role === 'physician' || role === 'doctor') return 'doctor';
  if (role === 'nurse') return 'nurse';
  if (role === 'dentist') return 'dentist';
  return null;
}

const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  doctor: 'Physician',
  nurse: 'Nurse',
  dentist: 'Dentist',
};

function createSupabaseHealthServiceApi(): HealthServiceApi {
  return {
    async listStaff() {
      if (!supabase) throw new Error('Supabase not configured');

      // CampusCare clinic staff live in `public.users` (web_role), not health_staff.
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, primary_role, is_active')
        .eq('is_active', true)
        .in('primary_role', ['physician', 'doctor', 'nurse', 'dentist'])
        .order('full_name');

      if (error) throw error;

      return (data ?? [])
        .map((row) => {
          const role = mapWebRoleToStaffRole(String(row.primary_role));
          if (!role) return null;
          return {
            id: row.id as string,
            name: row.full_name as string,
            role,
            specialtyLabel: STAFF_ROLE_LABEL[role],
            photoUrl: (row.avatar_url as string | null) ?? undefined,
          } satisfies Staff;
        })
        .filter((s): s is Staff => s !== null);
    },

    async getOpenSlotLabels(staffId, day, period) {
      if (!supabase) throw new Error('Supabase not configured');

      const dayOfWeek = day.getDay();
      const { data: availability, error: availError } = await supabase
        .from('doctor_availability')
        .select('start_time, end_time')
        .eq('doctor_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (availError || !availability) return [];

      const dayStart = startsAtFromDayAndLabel(day, '12:00 AM');
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('starts_at')
        .eq('doctor_id', staffId)
        .gte('starts_at', dayStart.toISOString())
        .lt('starts_at', dayEnd.toISOString())
        .in('status', ['pending', 'confirmed', 'rescheduled', 'in_progress']);

      if (apptError) throw apptError;

      const bookedTimes = new Set(
        (appointments ?? []).map((a) => {
          const label = labelFromIso(a.starts_at as string);
          return timeFromLabel(label);
        }),
      );

      const slots: string[] = [];
      const startHour = parseInt(String(availability.start_time).split(':')[0], 10);
      const endHour = parseInt(String(availability.end_time).split(':')[0], 10);

      let periodStart: number;
      let periodEnd: number;
      switch (period) {
        case 'morning':
          periodStart = Math.max(startHour, 8);
          periodEnd = Math.min(endHour, 12);
          break;
        case 'afternoon':
          periodStart = Math.max(startHour, 12);
          periodEnd = Math.min(endHour, 17);
          break;
        case 'evening':
          periodStart = Math.max(startHour, 17);
          periodEnd = Math.min(endHour, 20);
          break;
        case 'night':
          periodStart = Math.max(startHour, 20);
          periodEnd = Math.min(endHour, 24);
          break;
      }

      for (let hour = periodStart; hour < periodEnd; hour++) {
        for (let minute = 0; minute < 60; minute += 20) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          if (!bookedTimes.has(timeStr)) {
            slots.push(labelFromTime(timeStr));
          }
        }
      }

      return slots;
    },

    async isWorking(staffId, day) {
      if (!supabase) throw new Error('Supabase not configured');

      const dayOfWeek = day.getDay();
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('id')
        .eq('doctor_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      return !error && !!data;
    },

    async listMyAppointments() {
      if (!supabase) throw new Error('Supabase not configured');

      const { patientId } = await requireLinkedPatient();

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, doctor_id, starts_at, ends_at, status, created_at, reason')
        .eq('patient_id', patientId)
        .in('status', [
          'pending',
          'confirmed',
          'rescheduled',
          'in_progress',
          'completed',
          'cancelled',
          'no_show',
        ])
        .order('starts_at', { ascending: true });

      if (error) throw error;

      return (appointments ?? []).map((appt) => ({
        id: appt.id as string,
        staffId: appt.doctor_id as string,
        dateKey: dateKeyInClinicTz(appt.starts_at as string),
        startLabel: labelFromIso(appt.starts_at as string),
        endLabel: appt.ends_at ? labelFromIso(appt.ends_at as string) : undefined,
        reason: (appt.reason as string | null) ?? null,
        status: mapDbStatus(String(appt.status)),
        createdAt: appt.created_at as string,
      }));
    },

    async bookAppointment(input) {
      if (!supabase) throw new Error('Supabase not configured');

      const { patientId, clinicId } = await requireLinkedPatient();

      const startsAt = startsAtFromDayAndLabel(input.day, input.startLabel);
      const endsAt = new Date(startsAt.getTime() + 20 * 60 * 1000);

      const { data: inserted, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: input.staffId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          reason: input.symptoms?.trim() || null,
          status: 'pending',
        })
        .select('id, created_at')
        .single();

      if (error) throw error;

      return {
        id: inserted.id as string,
        checkInCode: '—',
        createdAt: inserted.created_at as string,
      };
    },

    async cancelAppointment(id) {
      if (!supabase) throw new Error('Supabase not configured');

      const { patientId } = await requireLinkedPatient();

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('patient_id', patientId);

      if (error) throw error;
    },

    async confirmAppointmentByProvider(id) {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;
    },

    async getActiveTickets() {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data, error } = await supabase
        .from('health_queue_tickets')
        .select('*')
        .in('status', ['waiting', 'called'])
        .gt('expires_at', new Date().toISOString())
        .order('queue_position');
      
      if (error) throw error;
      
      return data.map(ticket => ({
        code: ticket.ticket_code,
        position: ticket.queue_position,
        estimatedMinutes: ticket.estimated_wait_minutes,
        status: ticket.status,
      }));
    },

    async generateTicketForAppointment(appointmentId: string) {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data, error } = await supabase.rpc('generate_ticket_for_appointment', {
        p_appointment_id: appointmentId
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { success: false, ticketCode: null, queuePosition: null, estimatedWaitMinutes: null, expiresAt: null };
      }
      
      const ticket = data[0];
      return {
        success: true,
        ticketCode: ticket.ticket_code,
        queuePosition: ticket.queue_position,
        estimatedWaitMinutes: ticket.estimated_wait_minutes,
        expiresAt: ticket.expires_at,
      };
    },

    async checkInPatient(ticketCode) {
      if (!supabase) throw new Error('Supabase not configured');
      
      // Find the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('health_queue_tickets')
        .select(`
          *,
          health_appointments (
            id,
            student_id,
            staff_id,
            appointment_date,
            start_time,
            status
          )
        `)
        .eq('ticket_code', ticketCode)
        .eq('status', 'waiting')
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (ticketError || !ticket) {
        return { success: false };
      }
      
      // Update ticket status to 'called'
      const { error: updateError } = await supabase
        .from('health_queue_tickets')
        .update({ 
          status: 'called',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', ticket.id);
      
      if (updateError) throw updateError;
      
      return {
        success: true,
        appointment: {
          id: ticket.health_appointments.id,
          staffId: ticket.health_appointments.staff_id,
          dateKey: ticket.health_appointments.appointment_date,
          startLabel: labelFromTime(ticket.health_appointments.start_time),
          status: ticket.health_appointments.status,
          arrivalTicket: {
            code: ticket.ticket_code,
            position: ticket.queue_position,
            estimatedMinutes: ticket.estimated_wait_minutes,
            status: 'called',
          },
        },
      };
    },

    async recordVitalSigns(input) {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('health_vital_signs')
        .insert({
          appointment_id: input.appointmentId,
          ticket_id: input.ticketId,
          recorded_by: user.id,
          blood_pressure_systolic: input.bloodPressureSystolic,
          blood_pressure_diastolic: input.bloodPressureDiastolic,
          heart_rate: input.heartRate,
          temperature: input.temperature,
          weight: input.weight,
          height: input.height,
          oxygen_saturation: input.oxygenSaturation,
          notes: input.notes,
        });
      
      if (error) throw error;
    },

    async expireOldTickets() {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data, error } = await supabase.rpc('expire_old_tickets');
      
      if (error) throw error;
      return data || 0;
    },
  };
}

// Export the API instance
export const healthServiceApi: HealthServiceApi = createSupabaseHealthServiceApi();
