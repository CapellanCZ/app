import { useNotificationStore } from '@/lib/notifications/notificationStore';

const recentCancelNotifs = new Map<string, number>();
const recentConfirmNotifs = new Map<string, number>();
const recentCompletedNotifs = new Map<string, number>();
const DEDUPE_MS = 8_000;

/**
 * Notify the patient that an appointment was cancelled.
 * Dedupes client + realtime paths for the same appointment id.
 */
export function notifyAppointmentCancelled(
  userId: string | null | undefined,
  opts: { appointmentId?: string; doctorName?: string } = {},
): void {
  if (!userId) return;

  const key = opts.appointmentId ?? `cancel-${Date.now()}`;
  const now = Date.now();
  const prev = recentCancelNotifs.get(key);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recentCancelNotifs.set(key, now);

  const name = opts.doctorName?.trim() || 'a campus doctor';
  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: 'Appointment Cancelled',
    body: `Your scheduled clinic visit with ${name} was cancelled. Book a new slot with a campus doctor anytime.`,
    href: '/appointments',
    source: 'Health Service',
    notificationType: 'error',
  });
}

/**
 * Notify the patient that an appointment was confirmed.
 * Prefer the DB trigger (`Appointment Confirmed!`) — kept for rare offline/dev paths.
 * Dedupes client paths for the same appointment id.
 */
export function notifyAppointmentConfirmed(
  userId: string | null | undefined,
  opts: { appointmentId?: string; doctorName?: string } = {},
): void {
  if (!userId) return;

  const key = opts.appointmentId ?? `confirm-${Date.now()}`;
  const now = Date.now();
  const prev = recentConfirmNotifs.get(key);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recentConfirmNotifs.set(key, now);

  const name = opts.doctorName?.trim() || 'your campus doctor';
  const appointmentId = opts.appointmentId;

  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: "You're All Set",
    body: `Your appointment with ${name} has been confirmed. Arrive a few minutes early and bring your school ID.`,
    href: appointmentId
      ? `/health-service/appointment/${appointmentId}`
      : '/appointments',
    source: 'Health Service',
    notificationType: 'success',
  });
}

/**
 * Notify the patient that the consultation / visit is completed.
 * Prefer DB trigger (`Visit Completed`); this is a client fallback with dedupe.
 */
export function notifyAppointmentCompleted(
  userId: string | null | undefined,
  opts: { appointmentId?: string; doctorName?: string } = {},
): void {
  if (!userId) return;

  const key = opts.appointmentId ?? `completed-${Date.now()}`;
  const now = Date.now();
  const prev = recentCompletedNotifs.get(key);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recentCompletedNotifs.set(key, now);

  const name = opts.doctorName?.trim() || 'your campus provider';
  const appointmentId = opts.appointmentId;

  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: 'Visit Completed',
    body: `Your consultation with ${name} is done. You can review this visit anytime.`,
    href: appointmentId ? `/visit-completed?id=${appointmentId}` : '/appointments',
    source: 'Health Service',
    notificationType: 'success',
  });
}
