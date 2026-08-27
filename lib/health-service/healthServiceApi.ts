/**
 * API-shaped surface for Health Service data with Supabase backend integration.
 * CampusCare live tables: `patients`, `appointments`, `doctor_availability`, `users`.
 */
import { supabase } from '../supabase';
import type { Appointment, AppointmentStatus, SlotPeriod, Staff, StaffRole, QueueTicket } from './types';

const CLINIC_TZ = 'Asia/Manila';

/** Thrown / mapped when patient already has an active visit that clinic day. */
export const ALREADY_BOOKED_SAME_DAY =
  'You already have an appointment on this day. Cancel it first to book another.';

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
      : 'idle';

  return {
    code: String(row.ticket_code ?? `${position}#`),
    position,
    estimatedMinutes: Number(row.estimated_wait_minutes ?? 0),
    status,
  };
}

/**
 * Attach `arrivalTicket` for confirmed visits so the booked screen can show
 * Queue / Patient Number immediately (no post-navigation fetch flash).
 */
async function attachArrivalTickets(
  patientId: string,
  appointments: Appointment[],
): Promise<Appointment[]> {
  if (!supabase || appointments.length === 0) return appointments;

  const needsTicket = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'completed',
  );
  if (needsTicket.length === 0) return appointments;

  const appointmentIds = needsTicket.map((a) => a.id);
  const serviceDates = [...new Set(needsTicket.map((a) => a.dateKey))];

  const filters: string[] = [];
  if (appointmentIds.length) {
    filters.push(`appointment_id.in.(${appointmentIds.join(',')})`);
  }
  if (serviceDates.length) {
    filters.push(`service_date.in.(${serviceDates.join(',')})`);
  }
  if (filters.length === 0) return appointments;

  const { data: tickets, error } = await supabase
    .from('health_queue_tickets')
    .select(
      'id, appointment_id, ticket_code, queue_position, queue_number, estimated_wait_minutes, status, service_date',
    )
    .eq('patient_id', patientId)
    .or(filters.join(','))
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[appointments] attachArrivalTickets failed:', error.message);
    return appointments;
  }

  const byAppointmentId = new Map<string, QueueTicket>();
  const byServiceDate = new Map<string, QueueTicket>();

  for (const row of tickets ?? []) {
    const mapped = mapQueueTicketRow(row);
    if (!mapped) continue;
    const apptId = row.appointment_id as string | null;
    if (apptId && !byAppointmentId.has(apptId)) {
      byAppointmentId.set(apptId, mapped);
    }
    const serviceDate = row.service_date as string | null;
    if (serviceDate && !byServiceDate.has(serviceDate)) {
      byServiceDate.set(serviceDate, mapped);
    }
  }

  return appointments.map((appt) => {
    if (appt.status !== 'confirmed' && appt.status !== 'completed') return appt;
    const ticket =
      byAppointmentId.get(appt.id) ?? byServiceDate.get(appt.dateKey) ?? undefined;
    return ticket ? { ...appt, arrivalTicket: ticket } : appt;
  });
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

export type DaySlot = {
  label: string;
  booked: boolean;
};

export type DayAvailabilitySlots = {
  working: boolean;
  /** e.g. "9:00 AM – 6:00 PM" from doctor_availability */
  hoursLabel: string | null;
  slots: DaySlot[];
};

/** School Doctors row status (Supabase schedule + breaks + cutoff). */
export type StaffPresenceStatus = 'available' | 'on_break' | 'cutoff' | 'unavailable';

export type HealthServiceApi = {
  listStaff(): Promise<Staff[]>;
  getOpenSlotLabels(staffId: string, day: Date, period: SlotPeriod): Promise<string[]>;
  /** All 20-min slots for a day from `doctor_availability` (+ booked flags). */
  getDaySlots(staffId: string, day: Date): Promise<DayAvailabilitySlots>;
  /** Active schedule days (0=Sun … 6=Sat) from `doctor_availability`. */
  getWorkingDaysOfWeek(staffId: string): Promise<number[]>;
  isWorking(staffId: string, day: Date): Promise<boolean>;
  /** Rich presence for School Doctors list. */
  getStaffPresence(staffId: string, day: Date): Promise<StaffPresenceStatus>;
  /** Pending + confirmed; excludes cancelled. */
  listMyAppointments(): Promise<Appointment[]>;
  bookAppointment(input: {
    staffId: string;
    day: Date;
    startLabel: string;
    symptoms?: string;
  }): Promise<{ id: string; checkInCode: string; createdAt: string; status: AppointmentStatus }>;
  /** Schedule a push/in-app reminder N minutes before a confirmed appointment. */
  scheduleAppointmentReminder(
    appointmentId: string,
    minutesBefore?: number,
  ): Promise<{ remindAt: string; minutesBefore: number }>;
  /** Patient's queue ticket for a confirmed appointment (if issued). */
  getQueueTicketForAppointment(appointmentId: string): Promise<QueueTicket | null>;
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

const SLOT_INTERVAL_MIN = 20;

/** Parse "09:00:00" / "9:00:00" → minutes from midnight. */
function timeStringToMinutes(time: string): number {
  const [h, m] = String(time).split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function minutesToTimeStr(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

function periodWindowMinutes(period: SlotPeriod): { start: number; end: number } {
  switch (period) {
    case 'morning':
      return { start: 8 * 60, end: 12 * 60 };
    case 'afternoon':
      return { start: 12 * 60, end: 17 * 60 };
    case 'evening':
      return { start: 17 * 60, end: 20 * 60 };
    case 'night':
      return { start: 20 * 60, end: 24 * 60 };
  }
}

/** Live break is active only while flagged and not past resumes_at. */
function isBreakActive(isOnBreak: boolean | null | undefined, resumesAt: string | null | undefined, now: Date): boolean {
  if (!isOnBreak) return false;
  if (resumesAt && new Date(resumesAt).getTime() <= now.getTime()) return false;
  return true;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type TimeWindow = { startMin: number; endMin: number };

function intersectWindows(a: TimeWindow, b: TimeWindow): TimeWindow | null {
  const startMin = Math.max(a.startMin, b.startMin);
  const endMin = Math.min(a.endMin, b.endMin);
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

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

    async getDaySlots(staffId, day) {
      if (!supabase) throw new Error('Supabase not configured');

      const dayOfWeek = day.getDay();
      const now = new Date();
      const bookingToday = isSameCalendarDay(day, now);

      // Doctor may have multiple windows per day (e.g. 9–12 and 1–6 with lunch off).
      const { data: availRows, error: availError } = await supabase
        .from('doctor_availability')
        .select('start_time, end_time, clinic_id')
        .eq('doctor_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time');

      if (availError || !availRows?.length) {
        return { working: false, hoursLabel: null, slots: [] };
      }

      const clinicId = availRows[0].clinic_id as string;

      const [{ data: office }, { data: clinicBreak }, { data: staffBreak }] = await Promise.all([
        supabase
          .from('clinic_office_hours')
          .select('start_time, end_time, is_closed')
          .eq('clinic_id', clinicId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle(),
        supabase
          .from('clinic_break_status')
          .select('is_on_break, resumes_at')
          .eq('clinic_id', clinicId)
          .maybeSingle(),
        supabase
          .from('staff_break_status')
          .select('is_on_break, resumes_at')
          .eq('user_id', staffId)
          .maybeSingle(),
      ]);

      if (office?.is_closed) {
        return { working: false, hoursLabel: null, slots: [] };
      }

      // Clinic-wide pause with no resume → closed for the day (today only).
      // Staff on-break still keeps morning/afternoon slots bookable; we only
      // skip times before resumes_at when that timestamp exists.
      if (
        bookingToday &&
        isBreakActive(clinicBreak?.is_on_break, clinicBreak?.resumes_at, now) &&
        !clinicBreak?.resumes_at
      ) {
        return { working: false, hoursLabel: null, slots: [] };
      }

      const officeWindow: TimeWindow | null =
        office?.start_time && office?.end_time
          ? {
              startMin: timeStringToMinutes(String(office.start_time)),
              endMin: timeStringToMinutes(String(office.end_time)),
            }
          : null;

      let windows: TimeWindow[] = availRows
        .map((row) => ({
          startMin: timeStringToMinutes(String(row.start_time)),
          endMin: timeStringToMinutes(String(row.end_time)),
        }))
        .filter((w) => w.endMin > w.startMin);

      if (officeWindow) {
        windows = windows
          .map((w) => intersectWindows(w, officeWindow))
          .filter((w): w is TimeWindow => w !== null);
      }

      // Skip times before now / before break resume (today only).
      // Does not wipe the rest of the day — afternoon (etc.) stays bookable.
      let earliestMin = 0;
      if (bookingToday) {
        earliestMin = Math.max(earliestMin, now.getHours() * 60 + now.getMinutes());

        if (isBreakActive(clinicBreak?.is_on_break, clinicBreak?.resumes_at, now) && clinicBreak?.resumes_at) {
          const resume = new Date(clinicBreak.resumes_at);
          earliestMin = Math.max(earliestMin, resume.getHours() * 60 + resume.getMinutes());
        }
        if (isBreakActive(staffBreak?.is_on_break, staffBreak?.resumes_at, now) && staffBreak?.resumes_at) {
          const resume = new Date(staffBreak.resumes_at);
          earliestMin = Math.max(earliestMin, resume.getHours() * 60 + resume.getMinutes());
        }
      }

      if (!windows.length) {
        return { working: false, hoursLabel: null, slots: [] };
      }

      const hoursLabel = windows
        .map(
          (w) =>
            `${labelFromTime(minutesToTimeStr(w.startMin))} – ${labelFromTime(minutesToTimeStr(w.endMin))}`,
        )
        .join(', ');

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

      const slots: DaySlot[] = [];
      for (const w of windows) {
        for (let t = w.startMin; t + SLOT_INTERVAL_MIN <= w.endMin; t += SLOT_INTERVAL_MIN) {
          if (bookingToday && t <= earliestMin) continue;
          const timeStr = minutesToTimeStr(t);
          slots.push({
            label: labelFromTime(timeStr),
            booked: bookedTimes.has(timeStr),
          });
        }
      }

      return { working: true, hoursLabel, slots };
    },

    async getOpenSlotLabels(staffId, day, period) {
      const { slots } = await this.getDaySlots(staffId, day);
      const window = periodWindowMinutes(period);
      return slots
        .filter((s) => {
          if (s.booked) return false;
          const mins = timeStringToMinutes(timeFromLabel(s.label));
          return mins >= window.start && mins < window.end;
        })
        .map((s) => s.label);
    },

    async getStaffPresence(staffId, day) {
      if (!supabase) throw new Error('Supabase not configured');

      const dayOfWeek = day.getDay();
      const now = new Date();
      const forToday = isSameCalendarDay(day, now);

      const { data: availRows, error } = await supabase
        .from('doctor_availability')
        .select('start_time, end_time, clinic_id')
        .eq('doctor_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time');

      if (error || !availRows?.length) return 'unavailable';

      const clinicId = availRows[0].clinic_id as string;

      const [{ data: office }, { data: clinicBreak }, { data: staffBreak }] = await Promise.all([
        supabase
          .from('clinic_office_hours')
          .select('start_time, end_time, is_closed')
          .eq('clinic_id', clinicId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle(),
        supabase
          .from('clinic_break_status')
          .select('is_on_break, resumes_at')
          .eq('clinic_id', clinicId)
          .maybeSingle(),
        supabase
          .from('staff_break_status')
          .select('is_on_break, resumes_at')
          .eq('user_id', staffId)
          .maybeSingle(),
      ]);

      if (office?.is_closed) return 'unavailable';

      if (forToday) {
        if (isBreakActive(clinicBreak?.is_on_break, clinicBreak?.resumes_at, now)) return 'on_break';
        if (isBreakActive(staffBreak?.is_on_break, staffBreak?.resumes_at, now)) return 'on_break';
      }

      const officeWindow: TimeWindow | null =
        office?.start_time && office?.end_time
          ? {
              startMin: timeStringToMinutes(String(office.start_time)),
              endMin: timeStringToMinutes(String(office.end_time)),
            }
          : null;

      let windows: TimeWindow[] = availRows
        .map((row) => ({
          startMin: timeStringToMinutes(String(row.start_time)),
          endMin: timeStringToMinutes(String(row.end_time)),
        }))
        .filter((w) => w.endMin > w.startMin);

      if (officeWindow) {
        windows = windows
          .map((w) => intersectWindows(w, officeWindow))
          .filter((w): w is TimeWindow => w !== null);
      }

      if (!windows.length) return 'unavailable';

      // Cutoff: scheduled today, but past the last bookable window (or nothing left to book).
      if (forToday) {
        const lastEnd = Math.max(...windows.map((w) => w.endMin));
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin >= lastEnd - SLOT_INTERVAL_MIN) return 'cutoff';
      }

      return 'available';
    },

    async getWorkingDaysOfWeek(staffId) {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase
        .from('doctor_availability')
        .select('day_of_week')
        .eq('doctor_id', staffId)
        .eq('is_active', true);

      if (error) throw error;

      const days = new Set<number>();
      for (const row of data ?? []) {
        const dow = Number(row.day_of_week);
        if (!Number.isNaN(dow)) days.add(dow);
      }
      return Array.from(days).sort((a, b) => a - b);
    },

    async isWorking(staffId, day) {
      const status = await this.getStaffPresence(staffId, day);
      return status === 'available';
    },

    async listMyAppointments() {
      if (!supabase) throw new Error('Supabase not configured');

      const { patientId } = await requireLinkedPatient();

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, doctor_id, starts_at, ends_at, status, created_at, reason, cancellation_reason')
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

      const mapped: Appointment[] = (appointments ?? []).map((appt) => ({
        id: appt.id as string,
        staffId: appt.doctor_id as string,
        dateKey: dateKeyInClinicTz(appt.starts_at as string),
        startLabel: labelFromIso(appt.starts_at as string),
        endLabel: appt.ends_at ? labelFromIso(appt.ends_at as string) : undefined,
        reason: (appt.reason as string | null) ?? null,
        cancellationReason: (appt.cancellation_reason as string | null) ?? null,
        status: mapDbStatus(String(appt.status)),
        createdAt: appt.created_at as string,
      }));

      return attachArrivalTickets(patientId, mapped);
    },

    async bookAppointment(input) {
      if (!supabase) throw new Error('Supabase not configured');

      const { patientId, clinicId } = await requireLinkedPatient();

      const startsAt = startsAtFromDayAndLabel(input.day, input.startLabel);
      const endsAt = new Date(startsAt.getTime() + 20 * 60 * 1000);
      const dayKey = dateKey(input.day);
      const dayStart = new Date(`${dayKey}T00:00:00+08:00`);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Friendly pre-check (unique index is the real race-safe guard).
      const { data: sameDay, error: sameDayError } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patientId)
        .in('status', ['pending', 'confirmed', 'rescheduled', 'in_progress'])
        .gte('starts_at', dayStart.toISOString())
        .lt('starts_at', dayEnd.toISOString())
        .limit(1);

      if (sameDayError) throw sameDayError;
      if (sameDay && sameDay.length > 0) {
        throw new Error(ALREADY_BOOKED_SAME_DAY);
      }

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
        .select('id, created_at, status')
        .single();

      if (error) {
        // 23505 = unique_violation (one-per-day index or other unique constraint)
        if (error.code === '23505') {
          throw new Error(ALREADY_BOOKED_SAME_DAY);
        }
        throw error;
      }

      // Resolve final status: web auto-confirm may update the row right after insert.
      let status = mapDbStatus(String(inserted.status ?? 'pending'));
      if (status !== 'confirmed') {
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((r) => setTimeout(r, 300));
          const { data: fresh } = await supabase
            .from('appointments')
            .select('status')
            .eq('id', inserted.id)
            .maybeSingle();
          status = mapDbStatus(String(fresh?.status ?? 'pending'));
          if (status === 'confirmed') break;
        }
      }

      return {
        id: inserted.id as string,
        checkInCode: '—',
        createdAt: inserted.created_at as string,
        status,
      };
    },

    async scheduleAppointmentReminder(appointmentId, minutesBefore = 30) {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.rpc('schedule_appointment_reminder', {
        p_appointment_id: appointmentId,
        p_minutes_before: minutesBefore,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.remind_at) {
        throw new Error('Failed to schedule reminder');
      }

      return {
        remindAt: String(row.remind_at),
        minutesBefore: Number(row.minutes_before ?? minutesBefore),
      };
    },

    async getQueueTicketForAppointment(appointmentId) {
      if (!supabase) throw new Error('Supabase not configured');
      const { patientId } = await requireLinkedPatient();

      // 1) Ticket linked by appointment_id
      const { data: byAppointment, error } = await supabase
        .from('health_queue_tickets')
        .select('ticket_code, queue_position, queue_number, estimated_wait_minutes, status')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const fromAppointment = byAppointment ? mapQueueTicketRow(byAppointment) : null;
      if (fromAppointment) return fromAppointment;

      // 2) Appointment row: queue_ticket_id / queue_number (admin may set these on confirm)
      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('starts_at, queue_number, queue_ticket_id')
        .eq('id', appointmentId)
        .eq('patient_id', patientId)
        .maybeSingle();
      if (apptError) throw apptError;

      if (appt?.queue_ticket_id) {
        const { data: byId, error: byIdError } = await supabase
          .from('health_queue_tickets')
          .select('ticket_code, queue_position, queue_number, estimated_wait_minutes, status')
          .eq('id', appt.queue_ticket_id as string)
          .maybeSingle();
        if (byIdError) throw byIdError;
        const fromTicketId = byId ? mapQueueTicketRow(byId) : null;
        if (fromTicketId) return fromTicketId;
      }

      if (typeof appt?.queue_number === 'number') {
        return {
          code: `${appt.queue_number}#`,
          position: appt.queue_number,
          estimatedMinutes: 0,
          status: 'waiting' as const,
        };
      }

      // 3) Same-day ticket for this patient (legacy clinic tickets)
      if (appt?.starts_at) {
        const serviceDate = dateKeyInClinicTz(appt.starts_at as string);
        const { data: byPatient, error: byPatientError } = await supabase
          .from('health_queue_tickets')
          .select('ticket_code, queue_position, queue_number, estimated_wait_minutes, status')
          .eq('patient_id', patientId)
          .eq('service_date', serviceDate)
          .in('status', ['waiting', 'called', 'idle', 'checked_in', 'completed', 'expired'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byPatientError) throw byPatientError;
        const fromPatientDay = byPatient ? mapQueueTicketRow(byPatient) : null;
        if (fromPatientDay) return fromPatientDay;
      }

      return null;
    },

    async cancelAppointment(id) {
      if (!supabase) throw new Error('Supabase not configured');

      const { patientId } = await requireLinkedPatient();

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Patient cancelled',
        })
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
  };
}

// Export the API instance
export const healthServiceApi: HealthServiceApi = createSupabaseHealthServiceApi();
