import { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { BottomSheetModal, type BottomSheetModalHandle } from '@/components/ui/BottomSheetModal';
import { formatAppointmentBookedDate } from '@/lib/health-service/appointmentDisplay';
import { useAppointmentStaffDisplay } from '@/lib/health-service/useAppointmentStaffDisplay';
import { Inter } from '@/lib/typography/inter';
import { playToastFeedback } from '@/lib/ui/feedbackSound';

/**
 * Completed visit receipt — bottom sheet (Past list + realtime).
 * Uses the same transparentModal + BottomSheetModal pattern as login.
 */
export default function VisitCompletedSheet() {
  const sheetRef = useRef<BottomSheetModalHandle>(null);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const appointmentId = id ? String(id) : undefined;

  useEffect(() => {
    void playToastFeedback('success');
  }, []);

  const { name, specialty, photoUrl, appointment } = useAppointmentStaffDisplay(appointmentId);

  const visitReason = useMemo(
    () => formatVisitReasonDisplay(appointment?.reason),
    [appointment?.reason],
  );

  const dateLabel = appointment
    ? formatAppointmentBookedDate(appointment.dateKey)
    : '—';

  const timeLabel = useMemo(() => {
    const start = appointment?.startLabel?.trim() ?? '';
    const end = appointment?.endLabel?.trim() ?? '';
    if (start && end) return `${start} · ${end}`;
    return start || end || '—';
  }, [appointment?.startLabel, appointment?.endLabel]);

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
            Consultation Summary
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
