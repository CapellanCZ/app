import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirmCancelAppointment } from '../../../components/health-service/CancelAppointmentDialog';
import { IconsaxArrowLeftIcon } from '../../../components/icons/IconsaxArrowLeftIcon';
import { IconsaxCalendarIcon } from '../../../components/icons/IconsaxCalendarIcon';
import { IconsaxClockIcon } from '../../../components/icons/IconsaxClockIcon';
import { IconsaxHospitalFilledIcon } from '../../../components/icons/IconsaxHospitalFilledIcon';
import { IconsaxVerifyIcon } from '../../../components/icons/IconsaxVerifyIcon';
import {
  formatAppointmentDateLong,
  formatAppointmentWhen,
  getPatientTicketLabel,
} from '../../../lib/health-service/appointmentDisplay';
import { healthServiceApi } from '../../../lib/health-service/healthServiceApi';
import { staffNameForAppointment, useHealthServiceStore } from '../../../lib/health-service/healthServiceStore';

const BRAND = '#2970FF';
const BRAND_LIGHT = '#528BFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E9EAEB';
const GRAY_500 = '#717680';
const GRAY_600 = '#535862';
const GRAY_800 = '#252B37';
const WHITE = '#FFFFFF';

const CLINIC_NAME = 'CampusCare Student Health';

export default function AppointmentConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = typeof id === 'string' ? id : id?.[0] ?? '';

  const appointments = useHealthServiceStore((s) => s.appointments);
  const { staff: allStaff } = useHealthServiceStore();

  const ap = useMemo(
    () => appointments.find((a) => a.id === appointmentId),
    [appointments, appointmentId],
  );

  const staff = ap ? allStaff.find((s) => s.id === ap.staffId) : undefined;
  const staffName = ap ? staffNameForAppointment(ap.staffId) : '';
  const whenLabel = ap ? formatAppointmentWhen(ap) : '';
  const dateLong = ap ? formatAppointmentDateLong(ap) : '';
  const patientLabel = ap ? getPatientTicketLabel(ap.id) : '';

  // Redirect to the new screen as soon as we have data
  useEffect(() => {
    if (ap) {
      router.replace({
        pathname: '/health-service/appointment-booked',
        params: {
          id: ap.id,
          doctorName: staffNameForAppointment(ap.staffId),
          appointmentDate: formatAppointmentDateLong(ap),
          appointmentTime: ap.startLabel,
          checkInCode: ap.checkInCode ?? 'CH-0000',
        },
      });
    } else {
      router.replace('/health-service/appointments');
    }
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

  const isPending = ap.status === 'pending';
  const isConfirmed = ap.status === 'confirmed';
  const isCancelled = ap.status === 'cancelled';
  const ticket = isConfirmed ? ap.arrivalTicket : undefined;

  // Loading placeholder while redirecting
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE }}>
      <ActivityIndicator />
    </View>
  );
}
