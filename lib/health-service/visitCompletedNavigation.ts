import { router } from 'expo-router';

import { formatAppointmentBookedDate } from '@/lib/health-service/appointmentDisplay';
import type { Appointment, Staff } from '@/lib/health-service/types';

const recentNav = new Map<string, number>();
const DEDUPE_MS = 8_000;

/**
 * Opens the Visit Completed receipt for a finished appointment.
 * Dedupes bursty realtime updates for the same id.
 */
export function openVisitCompletedScreen(
  appointment: Appointment,
  staff?: Pick<Staff, 'name' | 'specialtyLabel' | 'photoUrl'> | null,
): void {
  if (appointment.status !== 'completed') return;

  const now = Date.now();
  const prev = recentNav.get(appointment.id);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recentNav.set(appointment.id, now);

  const doctorName = staff?.name?.trim() || 'Clinic staff';

  router.push({
    pathname: '/visit-completed',
    params: {
      id: appointment.id,
      staffId: appointment.staffId,
      doctorName,
      specialtyLabel: staff?.specialtyLabel ?? 'Physician',
      photoUrl: staff?.photoUrl ?? '',
      appointmentDate: formatAppointmentBookedDate(appointment.dateKey),
      appointmentTime: appointment.startLabel,
      dateKey: appointment.dateKey,
      reason: appointment.reason ?? '',
      completedTime: appointment.endLabel ?? '',
    },
  });
}
