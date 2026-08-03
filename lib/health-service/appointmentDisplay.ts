import type { Appointment } from './types';

/** Stable ticket-style label, e.g. `Patient #1` (not a real name). */
export function getPatientTicketLabel(appointmentId: string): string {
  const m = /^ap-(\d+)$/.exec(appointmentId);
  if (m) {
    const raw = Number(m[1]);
    if (Number.isFinite(raw)) {
      const n = ((raw - 1) % 99) + 1;
      return `Patient #${n}`;
    }
  }
  let h = 0;
  for (let i = 0; i < appointmentId.length; i++) h = (h * 31 + appointmentId.charCodeAt(i)) | 0;
  return `Patient #${(Math.abs(h) % 99) + 1}`;
}

export function parseAppointmentDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((n) => Number(n));
  return new Date(y, m - 1, d);
}

/** e.g. "Wed, Apr 16 · 10:40 AM" */
export function formatAppointmentWhen(a: Appointment): string {
  const day = parseAppointmentDateKey(a.dateKey);
  const datePart = day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${datePart} · ${a.startLabel}`;
}

/** Long date for ticket-style layouts, e.g. "Wednesday, April 16, 2026" */
export function formatAppointmentDateLong(a: Appointment): string {
  const day = parseAppointmentDateKey(a.dateKey);
  return day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/** Figma card date: "24 Feb, Thu" */
export function formatAppointmentCardDate(dateKey: string): string {
  const day = parseAppointmentDateKey(dateKey);
  const dd = day.getDate();
  const mon = day.toLocaleDateString('en-GB', { month: 'short' });
  const weekday = day.toLocaleDateString('en-GB', { weekday: 'short' });
  return `${dd} ${mon}, ${weekday}`;
}

/** Booking success date: "3 Aug, Monday" (Figma 2248:186). */
export function formatAppointmentBookedDate(dateKey: string): string {
  const day = parseAppointmentDateKey(dateKey);
  const dd = day.getDate();
  const mon = day.toLocaleDateString('en-GB', { month: 'short' });
  const weekday = day.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${dd} ${mon}, ${weekday}`;
}

/** Parse "10:40 AM" → { hours, minutes } in 24h. */
export function parseStartLabelToMinutes(label: string): { hours: number; minutes: number } | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const period = m[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

/** Google Calendar template URL for a clinic-local Asia/Manila appointment. */
export function buildGoogleCalendarUrl(input: {
  title: string;
  dateKey: string;
  startLabel: string;
  durationMinutes?: number;
  details?: string;
  location?: string;
}): string | null {
  const parsed = parseStartLabelToMinutes(input.startLabel);
  if (!parsed) return null;

  const [y, mo, d] = input.dateKey.split('-').map(Number);
  if (!y || !mo || !d) return null;

  const duration = input.durationMinutes ?? 20;
  const startTotal = parsed.hours * 60 + parsed.minutes;
  const endTotal = startTotal + duration;
  const endHours = Math.floor(endTotal / 60) % 24;
  const endMinutes = endTotal % 60;

  // Floating local times + ctz so Google Calendar lands on the correct Manila wall clock.
  const stampLocal = (year: number, month: number, day: number, hours: number, minutes: number) =>
    `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}00`;

  const dates = `${stampLocal(y, mo, d, parsed.hours, parsed.minutes)}/${stampLocal(y, mo, d, endHours, endMinutes)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates,
    ctz: 'Asia/Manila',
    details: input.details ?? 'CampusCare clinic appointment',
  });
  if (input.location) params.set('location', input.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Clinic-local start instant for dateKey + "9:20 AM" (Asia/Manila, UTC+8). */
export function appointmentStartsAt(dateKey: string, startLabel: string): Date | null {
  const parsed = parseStartLabelToMinutes(startLabel);
  if (!parsed) return null;
  const [y, mo, d] = dateKey.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(Date.UTC(y, mo - 1, d, parsed.hours - 8, parsed.minutes, 0));
}

/** Reminder fire time = appointment start − minutesBefore. */
export function appointmentReminderAt(
  dateKey: string,
  startLabel: string,
  minutesBefore = 30,
): Date | null {
  const startsAt = appointmentStartsAt(dateKey, startLabel);
  if (!startsAt) return null;
  return new Date(startsAt.getTime() - minutesBefore * 60 * 1000);
}

/** e.g. "8:50 AM" from a Date in Asia/Manila. */
export function formatClinicTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '12';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const period = (parts.find((p) => p.type === 'dayPeriod')?.value ?? 'AM').toUpperCase();
  return `${hour}:${minute} ${period}`;
}

/** e.g. "3 Aug" from a Date in Asia/Manila. */
export function formatClinicDayMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  return `${day} ${month}`;
}

/** Estimated finish label from start (default 20-min slot), e.g. "9:40 AM". */
export function estimateEndLabel(startLabel: string, durationMinutes = 20): string | null {
  const parsed = parseStartLabelToMinutes(startLabel);
  if (!parsed) return null;
  let total = parsed.hours * 60 + parsed.minutes + durationMinutes;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Strip "10:00 AM" → "10:00" (24h-style display like Figma). */
function toClockLabel(label: string): string {
  const trimmed = label.trim();
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(trimmed);
  if (!m) return trimmed;
  let hour = Number(m[1]);
  const minute = m[2];
  const period = m[3]?.toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

/** Figma card time range: "10:00 - 10:15" */
export function formatAppointmentCardTime(startLabel: string, endLabel?: string | null): string {
  const start = toClockLabel(startLabel);
  if (!endLabel) return start;
  return `${start} - ${toClockLabel(endLabel)}`;
}
