import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxArrowLeftIcon } from '../../../components/icons/IconsaxArrowLeftIcon';
import { useHealthServiceStore } from '../../../lib/health-service/healthServiceStore';

const BRAND = '#2970FF';
const GRAY_800 = '#252B37';
const WHITE = '#FFFFFF';

export default function AppointmentConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = typeof id === 'string' ? id : id?.[0] ?? '';

  const appointments = useHealthServiceStore((s) => s.appointments);

  const ap = useMemo(
    () => appointments.find((a) => a.id === appointmentId),
    [appointments, appointmentId],
  );

  useEffect(() => {
    if (!ap) {
      router.replace('/appointments');
      return;
    }
    if (ap.status === 'cancelled') {
      router.replace('/appointments');
      return;
    }
    router.replace({
      pathname: '/health-service/appointment-booked',
      params: { id: ap.id },
    });
  }, [ap]);

  if (!ap) {
    return (
      <View style={{ flex: 1, backgroundColor: WHITE, paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <IconsaxArrowLeftIcon size={24} color={GRAY_800} />
        </Pressable>
        <Text style={{ marginTop: 32, fontSize: 20, fontWeight: '600', color: GRAY_800 }}>Appointment not found</Text>
        <Pressable
          onPress={() => router.replace('/health-service')}
          style={{ marginTop: 24, backgroundColor: BRAND, paddingVertical: 14, borderRadius: 24, alignItems: 'center' }}>
          <Text style={{ color: WHITE, fontSize: 16, fontWeight: '600' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE }}>
      <ActivityIndicator />
    </View>
  );
}
