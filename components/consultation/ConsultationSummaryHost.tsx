import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { ConsultationPrescriptionCard } from '@/components/consultation/ConsultationPrescriptionCard';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { VitalsSignsGrid } from '@/components/vitals/VitalsSignsGrid';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchConsultationPrescription } from '@/lib/consultation/consultationSummaryApi';
import { useConsultationSummaryStore } from '@/lib/consultation/consultationSummaryStore';
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
 * Consultation / visit-completed status sheet — content-sized with solid iOS dim.
 */
export function ConsultationSummaryHost() {
  const appointmentId = useConsultationSummaryStore((s) => s.appointmentId);
  const close = useConsultationSummaryStore((s) => s.close);
  const { patient } = useAuth();

  const [prescription, setPrescription] =
    useState<ConsultationPrescription>(EMPTY_PRESCRIPTION);

  const vitalsRevision = useVitalsStore((s) => s.revision);
  const loadConsultationVitals = useVitalsStore((s) => s.loadConsultationVitals);
  const consultationVitals = useVitalsStore((s) =>
    appointmentId ? (s.consultationByAppointment[appointmentId] ?? EMPTY_VITALS) : EMPTY_VITALS,
  );

  useEffect(() => {
    if (!appointmentId) {
      setPrescription(EMPTY_PRESCRIPTION);
      return;
    }

    void playToastFeedback('success');

    let cancelled = false;
    void fetchConsultationPrescription(appointmentId).then((result) => {
      if (!cancelled) setPrescription(result);
    });

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const { name, specialty, photoUrl, appointment } = useAppointmentStaffDisplay(
    appointmentId ?? undefined,
  );

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

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  return (
    <BottomSheetModal
      visible={Boolean(appointmentId)}
      onClose={handleClose}
      backgroundColor="#F9F9F9"
      bottomPadding={16}
      maxHeightFraction={0.88}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AppointmentBookedCheckIcon size={96} animateCheck />
          <Text style={[healthUiText.modalTitle, styles.center]}>Consultation Summary</Text>
          <Text style={[healthUiText.modalSubtitle, styles.center]}>
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
          onPress={handleClose}
          style={({ pressed }) => [styles.gotIt, { opacity: pressed ? 0.9 : 1 }]}>
          <Text style={healthUiText.primaryButton}>Got It</Text>
        </Pressable>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  center: {
    textAlign: 'center',
  },
  gotIt: {
    height: 48,
    borderRadius: 48,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
