import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useStaffPresenceStore } from '@/lib/health-service/staffPresenceStore';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { usePatientStore } from '@/lib/patients/patientStore';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';

const PREFETCH_TIMEOUT_MS = 12_000;

export type PrefetchCoreOptions = {
  email?: string;
  userMetadata?: Record<string, unknown>;
};

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
 * Prefetch home / tabs data + warm realtime channels while the branded splash shows.
 * Safe alongside AuthProvider effects (stores skip duplicate work when already loaded).
 */
export async function prefetchCoreData(
  userId: string,
  opts?: PrefetchCoreOptions,
): Promise<void> {
  const health = useHealthServiceStore.getState();
  const notifications = useNotificationStore.getState();
  const announcements = useAnnouncementStore.getState();
  const profile = useProfileStore.getState();
  const patient = usePatientStore.getState().patient;
  const vitals = useVitalsStore.getState();

  // Warm realtime early so the first screen is already live.
  const releaseAppointments = health.subscribeAppointments();
  const releaseNotifications = notifications.subscribe(userId);
  const releaseVitals = vitals.subscribe();

  try {
    await withTimeout(
      (async () => {
        await Promise.all([
          health.appointmentsLoaded ? Promise.resolve() : health.loadAppointments(),
          health.staffLoaded ? Promise.resolve() : health.loadStaff(),
          notifications.hasLoaded ? Promise.resolve() : notifications.fetchAll(userId),
          announcements.hasLoaded
            ? Promise.resolve()
            : announcements.load({ patientType: patient?.patient_type }),
          profile.profile?.id === userId && (profile.profile.full_name || profile.profile.first_name)
            ? Promise.resolve()
            : patient
              ? (() => {
                  useProfileStore.getState().setFromPatient(patient, userId, {
                    userMetadata: opts?.userMetadata,
                  });
                  return Promise.resolve();
                })()
              : profile.fetchProfile(userId, {
                  email: opts?.email,
                  userMetadata: opts?.userMetadata,
                }),
          vitals.load({
            studentId: patient?.student_id,
            employeeId: patient?.employee_id,
          }),
        ]);

        // Warm presence for every staff member after login (home + book).
        await useStaffPresenceStore.getState().loadAllStaff();
      })(),
      PREFETCH_TIMEOUT_MS,
    );
  } finally {
    // Global AppointmentSubscription / NotificationSubscription keep ref-counts alive.
    releaseAppointments();
    releaseNotifications();
    releaseVitals();
  }
}
