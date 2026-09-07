import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { ConsultationPrescriptionCard } from '@/components/consultation/ConsultationPrescriptionCard';
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
const SHEET_OFFSCREEN = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = Dimensions.get('window').height * 0.88;

/**
 * Root-level Consultation Summary sheet.
 * Uses RN Modal + presentationStyle="overFullScreen" so the iOS dim always shows.
 */
export function ConsultationSummaryHost() {
  const appointmentId = useConsultationSummaryStore((s) => s.appointmentId);
  const close = useConsultationSummaryStore((s) => s.close);
  const insets = useSafeAreaInsets();
  const { patient } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [prescription, setPrescription] =
    useState<ConsultationPrescription>(EMPTY_PRESCRIPTION);

  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN);

  const vitalsRevision = useVitalsStore((s) => s.revision);
  const loadConsultationVitals = useVitalsStore((s) => s.loadConsultationVitals);
  const consultationVitals = useVitalsStore((s) =>
    appointmentId ? (s.consultationByAppointment[appointmentId] ?? EMPTY_VITALS) : EMPTY_VITALS,
  );

  const finishClose = useCallback(() => {
    setMounted(false);
    close();
  }, [close]);

  const animateOut = useCallback(() => {
    sheetTranslateY.value = withTiming(
      SHEET_OFFSCREEN,
      { duration: 260, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        runOnJS(finishClose)();
      },
    );
  }, [sheetTranslateY, finishClose]);

  useEffect(() => {
    if (!appointmentId) return;

    setMounted(true);
    void playToastFeedback('success');
    sheetTranslateY.value = SHEET_OFFSCREEN;
    sheetTranslateY.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [appointmentId, sheetTranslateY]);

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

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!mounted || !appointmentId) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={animateOut}>
      <View style={styles.root}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close consultation summary"
            onPress={animateOut}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { paddingBottom: Math.max(insets.bottom, 12) + 16, maxHeight: SHEET_MAX_HEIGHT },
          ]}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 20, paddingTop: 4, paddingBottom: 8 }}>
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
              onPress={animateOut}
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
});
