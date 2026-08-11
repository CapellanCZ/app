import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';

/**
 * Keeps appointment realtime listening globally so confirm/cancel
 * notifications fire and completed visits open Visit Completed anywhere.
 */
export function AppointmentSubscription() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const subscribeAppointments = useHealthServiceStore((s) => s.subscribeAppointments);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const loadStaff = useHealthServiceStore((s) => s.loadStaff);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    void loadStaff();
    void loadAppointments();
    unsubscribeRef.current = subscribeAppointments();

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [userId, loadAppointments, loadStaff, subscribeAppointments]);

  return null;
}
