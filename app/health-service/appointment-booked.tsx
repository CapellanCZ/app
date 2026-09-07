import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { useAppointmentStatusStore } from '@/lib/health-service/appointmentStatusStore';

/**
 * Deep-link / legacy route → opens the root Appointment Status modal, then leaves.
 */
export default function AppointmentBookedRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const open = useAppointmentStatusStore((s) => s.open);

  useEffect(() => {
    const appointmentId = id ? String(id) : '';
    if (appointmentId) {
      open(appointmentId);
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/appointments');
    }
  }, [id, open]);

  return null;
}
