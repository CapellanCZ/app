import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppointmentStatusStore } from '@/lib/health-service/appointmentStatusStore';
import { useAppointmentFromStore } from '@/lib/health-service/useAppointmentStaffDisplay';

const BRAND = '#2970FF';
const WHITE = '#FFFFFF';

/**
 * Deep-link / legacy route → opens the root Appointment Status sheet, then leaves.
 */
export default function AppointmentConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = typeof id === 'string' ? id : id?.[0] ?? '';
  const openStatus = useAppointmentStatusStore((s) => s.open);
  const { appointment, appointmentsLoaded } = useAppointmentFromStore(appointmentId || undefined);

  useEffect(() => {
    if (!appointmentId) {
      router.replace('/appointments');
      return;
    }
    if (!appointmentsLoaded) return;

    if (!appointment || appointment.status === 'cancelled') {
      router.replace('/appointments');
      return;
    }

    openStatus(appointment.id);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/appointments');
    }
  }, [appointment, appointmentId, appointmentsLoaded, openStatus]);

  return (
    <View style={{ flex: 1, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={BRAND} />
    </View>
  );
}
