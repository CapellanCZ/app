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
