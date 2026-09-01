import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { acquireAnnouncementsSubscription } from '@/lib/announcements/realtimeSubscriptions';
import { useAnnouncementStore } from '@/lib/announcements/announcementStore';

/**
 * Keeps the home announcement carousel in sync when admins publish new posts.
 */
export function AnnouncementSubscription() {
  const { session, enrollmentStatus, patient } = useAuth();
  const userId = session?.user?.id;
  const load = useAnnouncementStore((s) => s.load);

  useEffect(() => {
    if (!userId || enrollmentStatus !== 'enrolled') return;

    const unsubscribe = acquireAnnouncementsSubscription(() => {
      void load({ force: true, patientType: patient?.patient_type });
    });

    return unsubscribe;
  }, [userId, enrollmentStatus, patient?.patient_type, load]);

  return null;
}
