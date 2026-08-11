import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useNotificationStore } from '@/lib/notifications/notificationStore';

const PREFETCH_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, ms);

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      });
  });
}

/**
 * Prefetch the data home / tabs need so the UI doesn't skeleton after splash.
 * Safe to call while AuthProvider also kicks off staff/appointments.
 */
export async function prefetchCoreData(userId: string): Promise<void> {
  const health = useHealthServiceStore.getState();
  const notifications = useNotificationStore.getState();
  const announcements = useAnnouncementStore.getState();

  await withTimeout(
    Promise.all([
      health.appointmentsLoaded ? Promise.resolve() : health.loadAppointments(),
      health.staffLoaded ? Promise.resolve() : health.loadStaff(),
      notifications.hasLoaded ? Promise.resolve() : notifications.fetchAll(userId),
      announcements.hasLoaded ? Promise.resolve() : announcements.load(),
    ]),
    PREFETCH_TIMEOUT_MS,
  );
}
