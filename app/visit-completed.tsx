import { useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { BottomSheetModal, type BottomSheetModalHandle } from '@/components/ui/BottomSheetModal';
import { formatAppointmentBookedDate } from '@/lib/health-service/appointmentDisplay';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { Inter } from '@/lib/typography/inter';

/**
 * Completed visit receipt — bottom sheet (Past list + realtime).
 * Uses the same transparentModal + BottomSheetModal pattern as login.
 */
export default function VisitCompletedSheet() {
  const sheetRef = useRef<BottomSheetModalHandle>(null);
  const {
    id,
    doctorName,
    specialtyLabel,
    photoUrl,
    appointmentDate,
    appointmentTime,
    dateKey,
    reason,
    completedTime,
  } = useLocalSearchParams<{
    id?: string;
    doctorName?: string;
    specialtyLabel?: string;
    photoUrl?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    dateKey?: string;
    reason?: string;
    completedTime?: string;
  }>();

  const appointments = useHealthServiceStore((s) => s.appointments);
  const appointment = useMemo(() => {
    const appointmentId = id ? String(id) : '';
    if (!appointmentId) return null;
    return appointments.find((a) => a.id === appointmentId) ?? null;
  }, [appointments, id]);

  const visitReason = useMemo(
    () => formatVisitReasonDisplay(reason || appointment?.reason),
    [reason, appointment?.reason],
  );

  const name = doctorName?.trim() || 'Clinic staff';
  const specialty = specialtyLabel?.trim() || 'Campus Clinic';
  const dateLabel =
    (dateKey ? formatAppointmentBookedDate(String(dateKey)) : null) ||
    appointmentDate?.trim() ||
    (appointment ? formatAppointmentBookedDate(appointment.dateKey) : null) ||
    '—';

  const appointmentTimeLabel =
    appointmentTime?.trim() || appointment?.startLabel?.trim() || '';
  const completedAtLabel =
    completedTime?.trim() || appointment?.endLabel?.trim() || '';

  const timeLabel =
    appointmentTimeLabel && completedAtLabel
      ? `${appointmentTimeLabel} · ${completedAtLabel}`
      : appointmentTimeLabel || completedAtLabel || '—';

  const dismiss = () => {
    sheetRef.current?.dismiss(() => router.back());
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onClose={() => router.back()}
      bottomPadding={16}
      backgroundColor="#F9F9F9">
      <View style={{ gap: 24, paddingTop: 12 }}>
        <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
          <AppointmentBookedCheckIcon size={96} animateCheck />
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 28,
              color: '#222222',
              letterSpacing: -2.24,
              lineHeight: 36,
              textAlign: 'center',
            }}>
            Visit Completed
          </Text>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 17,
              color: '#727272',
              letterSpacing: -0.64,
              lineHeight: 22,
              textAlign: 'center',
            }}>
            Your results and prescriptions will be{'\n'}available within a few hours.
          </Text>
        </View>

        <AppointmentBookedCard
          doctorName={name}
          specialtyLabel={specialty}
          photoUrl={photoUrl}
          dateLabel={dateLabel}
          timeLabel={timeLabel}
          visitReason={visitReason}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Got it"
          onPress={dismiss}
          style={{
            height: 48,
            borderRadius: 48,
            backgroundColor: '#000000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="active:opacity-90">
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 17,
              color: '#FFFFFF',
              letterSpacing: -1.2,
              lineHeight: 18,
            }}>
            Got It
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}
