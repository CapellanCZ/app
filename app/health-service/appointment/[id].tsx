import { useLocalSearchParams, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
  const staffName = ap ? staffNameForAppointment(ap) : '';
  const whenLabel = ap ? formatAppointmentWhen(ap) : '';
  const dateLong = ap ? formatAppointmentDateLong(ap) : '';
  const patientLabel = ap ? getPatientTicketLabel(ap.id) : '';

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

  return (
    <View style={{ flex: 1, backgroundColor: WHITE }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 100,
          paddingHorizontal: 16,
        }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <IconsaxArrowLeftIcon size={24} color={GRAY_800} />
          </Pressable>
          <Text style={{ marginLeft: 16, fontSize: 24, fontWeight: '500', color: '#000' }}>
            Appointment Confirmed
          </Text>
        </View>

        {/* Success Banner */}
        <View style={{
          backgroundColor: 'rgba(209,224,255,0.6)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 999,
            backgroundColor: BRAND,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <IconsaxVerifyIcon size={24} color={WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: GRAY_800 }}>
              {isCancelled ? 'Appointment Cancelled' : isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
            </Text>
            <Text style={{ fontSize: 14, color: GRAY_600, marginTop: 2 }}>
              {isCancelled ? 'This appointment has been cancelled' : isConfirmed ? 'Your appointment is confirmed' : 'Waiting for provider confirmation'}
            </Text>
          </View>
        </View>

        {/* Doctor Card */}
        <View style={{
          backgroundColor: GRAY_100,
          borderRadius: 24,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: GRAY_500, marginBottom: 12 }}>
            CARE WITH
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 60, height: 60, borderRadius: 999,
              backgroundColor: WHITE,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: WHITE,
            }}>
              <IconsaxHospitalFilledIcon size={28} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '600', color: GRAY_800 }} numberOfLines={1}>
                {staffName}
              </Text>
              <Text style={{ fontSize: 14, color: GRAY_600, marginTop: 2 }}>
                {staff?.specialtyLabel || 'Healthcare Provider'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={{
          backgroundColor: WHITE,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: GRAY_200,
          padding: 20,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: GRAY_800, marginBottom: 16 }}>
            Appointment Details
          </Text>

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' }}>
                <IconsaxCalendarIcon size={20} color={BRAND} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: GRAY_500 }}>DATE</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: GRAY_800, marginTop: 2 }}>{dateLong}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' }}>
              <IconsaxClockIcon size={20} color={BRAND} />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: GRAY_500 }}>TIME</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: GRAY_800, marginTop: 2 }}>{ap.startLabel}</Text>
            </View>
          </View>
        </View>

        {/* Check-in Code */}
        {!isCancelled && (isConfirmed || isPending) && (
          <View style={{
            backgroundColor: WHITE,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: GRAY_200,
            padding: 20,
            marginBottom: 24,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: GRAY_500, marginBottom: 8 }}>
              CHECK-IN CODE
            </Text>
            <Text style={{ fontSize: 13, color: GRAY_600, textAlign: 'center', marginBottom: 16 }}>
              Present this code to the nurse at the clinic desk
            </Text>
            <View style={{
              backgroundColor: 'rgba(41, 112, 255, 0.08)',
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderWidth: 1,
              borderColor: 'rgba(41, 112, 255, 0.2)',
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: BRAND, letterSpacing: 6 }}>
                {ticket?.code || ap.checkInCode || ap.id.slice(0, 6).toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: GRAY_500, marginTop: 12, textAlign: 'center' }}>
              {ticket?.status === 'called' 
                ? `You are Patient ${patientLabel} · Please proceed` 
                : 'Waiting for check-in · Present code to nurse'}
            </Text>
          </View>
        )}

        {/* Cancelled Message */}
        {isCancelled && (
          <View style={{
            backgroundColor: '#FEF2F2',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#FECACA',
            padding: 20,
            marginBottom: 24,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#DC2626' }}>
              Appointment Cancelled
            </Text>
            <Text style={{ fontSize: 14, color: GRAY_600, marginTop: 8, textAlign: 'center' }}>
              This slot has been released. You can book another visit anytime.
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={{ gap: 12 }}>
          {!isCancelled && isPending && (
            <Pressable
              onPress={() => void healthServiceApi.confirmAppointmentByProvider(ap.id)}
              style={{
                backgroundColor: BRAND,
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
              <Text style={{ color: WHITE, fontSize: 16, fontWeight: '600' }}>
                Confirm Appointment (Demo)
              </Text>
            </Pressable>
          )}

          {!isCancelled && (isPending || isConfirmed) && (
            <Pressable
              onPress={() =>
                confirmCancelAppointment({
                  staffName,
                  whenLabel,
                  status: isPending ? 'pending' : 'confirmed',
                  onConfirm: () => {
                    void healthServiceApi.cancelAppointment(ap.id);
                    router.back();
                  },
                })
              }
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FECACA',
              }}>
              <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '500' }}>
                Cancel Appointment
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: GRAY_100,
              borderRadius: 24,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text style={{ color: GRAY_800, fontSize: 16, fontWeight: '600' }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
