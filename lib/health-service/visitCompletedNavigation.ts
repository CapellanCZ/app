import { router } from 'expo-router';

import type { Appointment } from '@/lib/health-service/types';

const recentNav = new Map<string, number>();
const DEDUPE_MS = 8_000;

/**
 * Opens the Visit Completed receipt for a finished appointment.
 * Dedupes bursty realtime updates for the same id.
 */
export function openVisitCompletedScreen(appointment: Appointment): void {
  if (appointment.status !== 'completed') return;

  const now = Date.now();
  const prev = recentNav.get(appointment.id);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recentNav.set(appointment.id, now);

  router.push({
    pathname: '/visit-completed',
    params: { id: appointment.id },
  });
}
