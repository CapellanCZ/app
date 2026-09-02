import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { ConsultationPrescriptionCard } from '@/components/consultation/ConsultationPrescriptionCard';
import { BottomSheetModal, type BottomSheetModalHandle } from '@/components/ui/BottomSheetModal';
import { VitalsSignsGrid } from '@/components/vitals/VitalsSignsGrid';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchConsultationPrescription } from '@/lib/consultation/consultationSummaryApi';
import type { ConsultationPrescription } from '@/lib/consultation/types';
import { formatAppointmentBookedDate } from '@/lib/health-service/appointmentDisplay';
import { useAppointmentStaffDisplay } from '@/lib/health-service/useAppointmentStaffDisplay';
import { healthUiText } from '@/lib/typography/healthUiText';
import { playToastFeedback } from '@/lib/ui/feedbackSound';
import { EMPTY_VITALS } from '@/lib/vitals/vitalsApi';
import { hasVitalsReadings } from '@/lib/vitals/vitalsDisplay';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';

const EMPTY_PRESCRIPTION: ConsultationPrescription = { medications: [], updatedAt: null };

/**
 * Completed visit receipt — bottom sheet (Past list + realtime).
 */
export default function VisitCompletedSheet() {
  const sheetRef = useRef<BottomSheetModalHandle>(null);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const appointmentId = id ? String(id) : undefined;
  const { patient } = useAuth();

  const [prescription, setPrescription] = useState<ConsultationPrescription>(EMPTY_PRESCRIPTION);

  const vitalsRevision = useVitalsStore((s) => s.revision);
  const loadConsultationVitals = useVitalsStore((s) => s.loadConsultationVitals);
  const consultationVitals = useVitalsStore((s) =>
    appointmentId ? (s.consultationByAppointment[appointmentId] ?? EMPTY_VITALS) : EMPTY_VITALS,
  );

  useEffect(() => {
    void playToastFeedback('success');
  }, []);

  useEffect(() => {
    if (!appointmentId) {
      setPrescription(EMPTY_PRESCRIPTION);
      return;
    }

    let cancelled = false;
    void fetchConsultationPrescription(appointmentId).then((result) => {
      if (!cancelled) setPrescription(result);
    });

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const { name, specialty, photoUrl, appointment } = useAppointmentStaffDisplay(appointmentId);

  useEffect(() => {
    if (!appointmentId) return;

    void loadConsultationVitals({
      appointmentId,
      studentId: patient?.student_id ?? null,
      employeeId: patient?.employee_id ?? null,
      serviceDate: appointment?.dateKey ?? null,
    });
  }, [
    appointmentId,
    appointment?.dateKey,
    patient?.student_id,
    patient?.employee_id,
    vitalsRevision,
    loadConsultationVitals,
  ]);

  const hasConsultationVitals = hasVitalsReadings(consultationVitals);

  const visitReason = useMemo(
    () => formatVisitReasonDisplay(appointment?.reason),
    [appointment?.reason],
  );

  const dateLabel = appointment ? formatAppointmentBookedDate(appointment.dateKey) : '—';

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
          <AppointmentBookedCheckIcon size={96} animateCheck />
          <Text style={[healthUiText.modalTitle, { textAlign: 'center' }]}>
            Consultation Summary
          </Text>
          <Text style={[healthUiText.modalSubtitle, { textAlign: 'center' }]}>
            Review your visit details below.
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

        {hasConsultationVitals ? (
          <VitalsSignsGrid vitals={consultationVitals} collapsible defaultExpanded={false} />
        ) : null}

        {prescription.medications.length > 0 ? (
          <ConsultationPrescriptionCard medications={prescription.medications} />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Got it"
          onPress={dismiss}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: 48,
            backgroundColor: '#000000',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
          })}>
          <Text style={healthUiText.primaryButton}>Got It</Text>
        </Pressable>
      </ScrollView>
    </BottomSheetModal>
  );
}
