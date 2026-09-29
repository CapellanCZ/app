import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { ConsultationFollowUpNote } from '@/components/consultation/ConsultationFollowUpNote';
import { PrescriptionDocumentViewer } from '@/components/consultation/PrescriptionDocumentViewer';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { VitalsSignsGrid } from '@/components/vitals/VitalsSignsGrid';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  fetchConsultationFollowUpDate,
  formatConsultationFollowUpLabel,
  subscribeConsultationFollowUpDate,
} from '@/lib/consultation/consultationFollowUpApi';
import { fetchIssuedPrescriptionDocument } from '@/lib/consultation/consultationSummaryApi';
import { useConsultationSummaryStore } from '@/lib/consultation/consultationSummaryStore';
import type { IssuedPrescriptionDocument } from '@/lib/consultation/types';
import { formatAppointmentBookedDate } from '@/lib/health-service/appointmentDisplay';
import { useAppointmentStaffDisplay } from '@/lib/health-service/useAppointmentStaffDisplay';
import { healthUiText } from '@/lib/typography/healthUiText';
import { Inter } from '@/lib/typography/inter';
import { playToastFeedback } from '@/lib/ui/feedbackSound';
import { EMPTY_VITALS } from '@/lib/vitals/vitalsApi';
import { hasVitalsReadings } from '@/lib/vitals/vitalsDisplay';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';

/**
 * Consultation / visit-completed status sheet — content-sized with solid iOS dim.
 */
export function ConsultationSummaryHost() {
  const appointmentId = useConsultationSummaryStore((s) => s.appointmentId);
  const close = useConsultationSummaryStore((s) => s.close);
  const { patient } = useAuth();

  const [issuedRx, setIssuedRx] = useState<IssuedPrescriptionDocument | null>(null);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [followUpDateKey, setFollowUpDateKey] = useState<string | null>(null);

  const vitalsRevision = useVitalsStore((s) => s.revision);
  const loadConsultationVitals = useVitalsStore((s) => s.loadConsultationVitals);
  const consultationVitals = useVitalsStore((s) =>
    appointmentId ? (s.consultationByAppointment[appointmentId] ?? EMPTY_VITALS) : EMPTY_VITALS,
  );

  useEffect(() => {
    if (!appointmentId) {
      setIssuedRx(null);
      setRxError(null);
      setRxLoading(false);
      setViewerOpen(false);
      setFollowUpDateKey(null);
      return;
    }

    void playToastFeedback('success');

    let cancelled = false;
    setRxLoading(true);
    setRxError(null);

    void fetchIssuedPrescriptionDocument(appointmentId)
      .then((result) => {
        if (!cancelled) {
          setIssuedRx(result);
          setRxLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setIssuedRx(null);
          setRxLoading(false);
          setRxError(err instanceof Error ? err.message : 'Could not load prescription.');
        }
      });

    void fetchConsultationFollowUpDate(appointmentId).then((dateKey) => {
      if (!cancelled) setFollowUpDateKey(dateKey);
    });

    const unsubscribe = subscribeConsultationFollowUpDate(appointmentId, (dateKey) => {
      if (!cancelled) setFollowUpDateKey(dateKey);
    });

    return () => {
      cancelled = true;
      unsubscribe();
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

  const followUpLabel = useMemo(
    () => (followUpDateKey ? formatConsultationFollowUpLabel(followUpDateKey) : null),
    [followUpDateKey],
  );

  const handleClose = useCallback(() => {
    setViewerOpen(false);
    close();
  }, [close]);

  const hasPrescription = Boolean(issuedRx) || rxLoading;

  return (
    <>
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

          {hasPrescription ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View Prescription"
              disabled={rxLoading}
              onPress={() => setViewerOpen(true)}
              style={({ pressed }) => [
                styles.viewRxBtn,
                { opacity: pressed || rxLoading ? 0.85 : 1 },
              ]}>
              {rxLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.viewRxLabel}>View Prescription</Text>
              )}
            </Pressable>
          ) : null}

          {followUpLabel ? <ConsultationFollowUpNote dateLabel={followUpLabel} /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Got it"
            onPress={handleClose}
            style={({ pressed }) => [styles.gotIt, { opacity: pressed ? 0.9 : 1 }]}>
            <Text style={healthUiText.primaryButton}>Got It</Text>
          </Pressable>
        </ScrollView>
      </BottomSheetModal>

      <PrescriptionDocumentViewer
        visible={viewerOpen}
        document={issuedRx}
        loading={rxLoading}
        error={rxError}
        onClose={() => setViewerOpen(false)}
      />
    </>
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
  viewRxBtn: {
    height: 48,
    borderRadius: 48,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRxLabel: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.32,
  },
  gotIt: {
    height: 48,
    borderRadius: 48,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
