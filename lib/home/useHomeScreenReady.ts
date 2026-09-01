import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';

/** True once every Home section has finished its first fetch. */
export function useHomeScreenReady(): boolean {
  const appointmentsLoaded = useHealthServiceStore((s) => s.appointmentsLoaded);
  const staffLoaded = useHealthServiceStore((s) => s.staffLoaded);
  const announcementsLoaded = useAnnouncementStore((s) => s.hasLoaded);
  const vitalsLoaded = useVitalsStore((s) => s.hasLoaded);
  const profileLoading = useProfileStore((s) => s.isLoading);
  const { patient } = useAuth();

  const profileReady = Boolean(patient?.full_name?.trim()) || !profileLoading;

  return (
    appointmentsLoaded &&
    staffLoaded &&
    announcementsLoaded &&
    vitalsLoaded &&
    profileReady
  );
}
