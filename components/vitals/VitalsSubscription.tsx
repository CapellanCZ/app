import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';

/**
 * Keeps patient vitals prefetched and live via `patient_records` realtime.
 */
export function VitalsSubscription() {
  const { session, enrollmentStatus, patient } = useAuth();
  const userId = session?.user?.id;
  const subscribe = useVitalsStore((s) => s.subscribe);
  const load = useVitalsStore((s) => s.load);

  useEffect(() => {
    if (!userId || enrollmentStatus !== 'enrolled') return;

    void load({
      studentId: patient?.student_id,
      employeeId: patient?.employee_id,
    });

    const unsubscribe = subscribe();
    return unsubscribe;
  }, [
    userId,
    enrollmentStatus,
    patient?.student_id,
    patient?.employee_id,
    subscribe,
    load,
  ]);

  return null;
}
