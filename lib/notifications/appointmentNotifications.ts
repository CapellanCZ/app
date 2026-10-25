import { useNotificationStore } from '@/lib/notifications/notificationStore';

const recentCancelNotifs = new Map<string, number>();
const recentConfirmNotifs = new Map<string, number>();
const recentCompletedNotifs = new Map<string, number>();
const recentRescheduleNotifs = new Map<string, number>();
const DEDUPE_MS = 8_000;

/**
 * Notify the patient that an appointment was cancelled.
 * Dedupes client + realtime paths for the same appointment id.
 * Copy stays generic (no provider names) for lock-screen / tray privacy.
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

  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: 'Appointment Cancelled',
    body: 'Your scheduled clinic visit was cancelled. Open CampusCare to book a new slot.',
    href: '/appointments',
    source: 'Health Service',
    notificationType: 'error',
  });
}

/**
 * Notify the patient that an appointment was confirmed.
 * Prefer the DB trigger (`Appointment Confirmed!`) — kept for rare offline/dev paths.
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

  const appointmentId = opts.appointmentId;

  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: "You're All Set",
    body: 'Your appointment is confirmed. Open CampusCare for time and provider details.',
    href: appointmentId
      ? `/health-service/appointment/${appointmentId}`
      : '/appointments',
    source: 'Health Service',
    notificationType: 'success',
  });
}

/**
 * Notify the patient that an appointment was rescheduled.
 * Prefer the DB trigger (`Appointment Rescheduled`) — kept for rare offline/dev paths.
 */
export function notifyAppointmentRescheduled(
  userId: string | null | undefined,
  opts: { appointmentId?: string; doctorName?: string; whenLabel?: string } = {},
): void {
  if (!userId) return;

  const key = opts.appointmentId ?? `reschedule-${Date.now()}`;
  const now = Date.now();
  const prev = recentRescheduleNotifs.get(key);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recentRescheduleNotifs.set(key, now);

  const appointmentId = opts.appointmentId;

  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: 'Appointment Rescheduled',
    body: 'Your appointment was rescheduled. Open CampusCare to review the new schedule.',
    href: appointmentId
      ? `/health-service/appointment/${appointmentId}`
      : '/appointments',
    source: 'Health Service',
    notificationType: 'warning',
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

  const appointmentId = opts.appointmentId;

  useNotificationStore.getState().notifySelf(userId, {
    category: 'health',
    title: 'Visit Completed',
    body: 'Your clinic visit is complete. Open CampusCare to review details.',
    href: appointmentId ? `/visit-completed?id=${appointmentId}` : '/appointments',
    source: 'Health Service',
    notificationType: 'success',
  });
}
