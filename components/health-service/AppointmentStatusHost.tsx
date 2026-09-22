import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { AppointmentImportantNote } from '@/components/booking/AppointmentImportantNote';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  appointmentReminderAt,
  buildGoogleCalendarUrl,
  estimateEndLabel,
  formatAppointmentBookedDate,
  formatClinicDayMonth,
  formatClinicTime,
} from '@/lib/health-service/appointmentDisplay';
import { useAppointmentStatusStore } from '@/lib/health-service/appointmentStatusStore';
import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useAppointmentStaffDisplay } from '@/lib/health-service/useAppointmentStaffDisplay';
import { notifyAppointmentCancelled } from '@/lib/notifications/appointmentNotifications';
import { Inter } from '@/lib/typography/inter';
import { playToastFeedback } from '@/lib/ui/feedbackSound';
import { showAppToast } from '@/lib/ui/toastBridge';

const REMINDER_MINUTES_BEFORE = 30;
const CLINIC_LOCATION = 'CampusCare Student Health Clinic';

/**
 * Pending / confirmed appointment status sheet — content-sized with solid iOS dim.
 */
export function AppointmentStatusHost() {
  const appointmentId = useAppointmentStatusStore((s) => s.appointmentId);
  const close = useAppointmentStatusStore((s) => s.close);
  const { session } = useAuth();

  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderSetAt, setReminderSetAt] = useState<Date | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [queueNumberLabel, setQueueNumberLabel] = useState<string | null>(null);

  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const cancelAppointment = useHealthServiceStore((s) => s.cancelAppointment);

  const { name, specialty, photoUrl, appointment } = useAppointmentStaffDisplay(
    appointmentId ?? undefined,
  );

  const visitReason = useMemo(
    () => formatVisitReasonDisplay(appointment?.reason),
    [appointment?.reason],
  );

  const isConfirmed = appointment?.status === 'confirmed';
  const isPending = appointment?.status === 'pending';
  /** Once hydrated, only pending/confirmed belong on this sheet. */
  const isActiveUpcoming =
    appointment == null || isPending || isConfirmed;

  const prefetchedQueueLabel = appointment?.arrivalTicket
    ? `${appointment.arrivalTicket.position}#`
    : null;
  const displayQueueLabel = queueNumberLabel ?? prefetchedQueueLabel;

  const time = appointment?.startLabel?.trim() || '—';
  const dateKey = appointment?.dateKey ?? '';
  const dateLabel = appointment ? formatAppointmentBookedDate(appointment.dateKey) : '—';
  const estDoneLabel = isConfirmed && time !== '—' ? estimateEndLabel(time) : null;

  useEffect(() => {
    if (!appointmentId) return;
    void loadAppointments();
  }, [appointmentId, loadAppointments]);

  useEffect(() => {
    if (!appointmentId || appointment == null) return;
    if (!isActiveUpcoming) close();
  }, [appointmentId, appointment, isActiveUpcoming, close]);

  useEffect(() => {
    if (!appointmentId || !isActiveUpcoming || appointment == null) return;
    void playToastFeedback('success');
  }, [appointmentId, appointment, isActiveUpcoming]);

  useEffect(() => {
    if (!appointmentId || !isConfirmed) {
      setQueueNumberLabel(null);
      return;
    }

    if (prefetchedQueueLabel) setQueueNumberLabel(prefetchedQueueLabel);

    let cancelled = false;
    void (async () => {
      try {
        const ticket = await healthServiceApi.getQueueTicketForAppointment(appointmentId);
        if (cancelled) return;
        setQueueNumberLabel(ticket ? `${ticket.position}#` : prefetchedQueueLabel);
      } catch (error) {
        console.warn('[queue] fetch failed:', error);
        if (!cancelled && !prefetchedQueueLabel) setQueueNumberLabel(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appointmentId, isConfirmed, prefetchedQueueLabel, appointment?.status]);

  useEffect(() => {
    if (!appointmentId) {
      setReminderBusy(false);
      setReminderSetAt(null);
      setCalendarBusy(false);
      setCancelBusy(false);
      setQueueNumberLabel(null);
    }
  }, [appointmentId]);

  const reminderAt = useMemo(() => {
    if (!dateKey || time === '—') return null;
    return appointmentReminderAt(dateKey, time, REMINDER_MINUTES_BEFORE);
  }, [dateKey, time]);

  const reminderAvailable = Boolean(reminderAt && reminderAt.getTime() > Date.now());

  const reminderLinkLabel = useMemo(() => {
    if (reminderSetAt) return `Reminder set for ${formatClinicTime(reminderSetAt)} →`;
    if (!reminderAt) return 'Get a reminder 30 minutes before →';
    return `Get a reminder at ${formatClinicTime(reminderAt)} (${formatClinicDayMonth(reminderAt)}) →`;
  }, [reminderAt, reminderSetAt]);

  const showReminder = Boolean(reminderSetAt || reminderAvailable);

  const requestCancel = useCallback(() => {
    if (!appointmentId || cancelBusy) return;

    Alert.alert(
      'Cancel appointment?',
      `Cancel your appointment with ${name}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setCancelBusy(true);
              try {
                await cancelAppointment(appointmentId);
                notifyAppointmentCancelled(session?.user?.id, {
                  appointmentId,
                  doctorName: name,
                });
                close();
                router.replace('/appointments');
              } catch {
                Alert.alert('Could not cancel', 'Please try again in a moment.');
              } finally {
                setCancelBusy(false);
              }
            })();
          },
        },
      ],
    );
  }, [appointmentId, cancelAppointment, cancelBusy, close, name, session?.user?.id]);

  const handleAddToCalendar = useCallback(async () => {
    if (!dateKey || time === '—' || calendarBusy) return;

    const url = buildGoogleCalendarUrl({
      title: `CampusCare · ${name}`,
      dateKey,
      startLabel: time,
      details: `Appointment with ${name} (${specialty})\nPlease arrive 15 minutes early and bring your school ID.`,
      location: CLINIC_LOCATION,
    });

    if (!url) {
      showAppToast({
        variant: 'danger',
        placement: 'top',
        label: 'Could not add to calendar',
        description: 'Invalid appointment date or time.',
      });
      return;
    }

    setCalendarBusy(true);
    try {
      await Linking.openURL(url);
      showAppToast({
        variant: 'success',
        placement: 'top',
        label: 'Opening calendar',
        description: `${dateLabel} at ${time}`,
      });
    } catch (error) {
      console.warn('[calendar] open failed:', error);
      showAppToast({
        variant: 'danger',
        placement: 'top',
        label: 'Could not open calendar',
        description: 'Please try again, or copy the appointment time manually.',
      });
    } finally {
      setCalendarBusy(false);
    }
  }, [calendarBusy, dateKey, dateLabel, name, specialty, time]);

  const handleReminder = useCallback(async () => {
    if (!appointmentId || !dateKey || time === '—' || reminderBusy || reminderSetAt) return;

    if (!reminderAvailable) {
      showAppToast({
        variant: 'accent',
        placement: 'top',
        label: 'Too close to start',
        description: `Your appointment is at ${time}. Reminders need at least ${REMINDER_MINUTES_BEFORE} minutes beforehand.`,
      });
      return;
    }

    const fireAt = appointmentReminderAt(dateKey, time, REMINDER_MINUTES_BEFORE);
    if (!fireAt) {
      showAppToast({
        variant: 'danger',
        placement: 'top',
        label: 'Could not set reminder',
        description: 'Invalid appointment date or time.',
      });
      return;
    }

    setReminderBusy(true);
    try {
      const scheduled = await healthServiceApi.scheduleAppointmentReminder(
        appointmentId,
        REMINDER_MINUTES_BEFORE,
      );
      const notifyAt = scheduled.remindAt ? new Date(scheduled.remindAt) : fireAt;
      const notifyInstant =
        !Number.isNaN(notifyAt.getTime()) && notifyAt.getTime() > Date.now() ? notifyAt : fireAt;

      try {
        const { isNotificationsAvailable } = await import(
          '@/lib/notifications/isNotificationsAvailable'
        );
        if (isNotificationsAvailable()) {
          const Notifications = await import('expo-notifications');
          const settings = await Notifications.getPermissionsAsync();
          let permission = settings.status;
          if (permission !== 'granted') {
            const req = await Notifications.requestPermissionsAsync();
            permission = req.status;
          }
          if (permission === 'granted') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Appointment in ${REMINDER_MINUTES_BEFORE} minutes`,
                body: `Your visit with ${name} is at ${time} on ${dateLabel}. Bring your school ID.`,
                data: { href: `/health-service/appointment/${appointmentId}` },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notifyInstant,
              },
            });
          }
        }
      } catch (localErr) {
        console.warn('[reminder] local schedule skipped:', localErr);
      }

      setReminderSetAt(notifyInstant);
      showAppToast({
        variant: 'success',
        placement: 'top',
        label: 'Reminder set',
        description: `We’ll notify you at ${formatClinicTime(notifyInstant)} on ${formatClinicDayMonth(notifyInstant)}.`,
      });
    } catch (error) {
      console.warn('[reminder] failed:', error);
      showAppToast({
        variant: 'danger',
        placement: 'top',
        label: 'Could not set reminder',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setReminderBusy(false);
    }
  }, [
    appointmentId,
    dateKey,
    dateLabel,
    name,
    reminderAvailable,
    reminderBusy,
    reminderSetAt,
    time,
  ]);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  return (
    <BottomSheetModal
      visible={Boolean(appointmentId) && isActiveUpcoming}
      onClose={handleClose}
      backgroundColor="#F9F9F9"
      bottomPadding={16}
      maxHeightFraction={0.92}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {isConfirmed ? (
          <View style={styles.block}>
            <View style={styles.header}>
              <AppointmentBookedCheckIcon size={96} animateCheck />
              <Text style={styles.title}>You’re all set!</Text>
              <Text style={styles.subtitle}>
                {'Your appointment has been successfully\nscheduled and confirmed.'}
              </Text>
            </View>

            <View style={styles.section}>
              <AppointmentBookedCard
                doctorName={name}
                specialtyLabel={specialty}
                photoUrl={photoUrl}
                dateLabel={dateLabel}
                timeLabel={time}
                estDoneLabel={estDoneLabel}
                showQueueRow
                queueNumberLabel={displayQueueLabel}
                visitReason={visitReason}
              />

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add to calendar"
                  disabled={calendarBusy}
                  onPress={() => void handleAddToCalendar()}
                  style={[styles.primaryBtn, { opacity: calendarBusy ? 0.7 : 1 }]}
                  className="active:opacity-90">
                  <Text style={styles.primaryBtnText}>Add to Calendar</Text>
                </Pressable>

                {showReminder ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={reminderLinkLabel}
                    disabled={reminderBusy || Boolean(reminderSetAt) || !reminderAvailable}
                    onPress={() => void handleReminder()}
                    style={[
                      styles.linkBtn,
                      {
                        opacity:
                          reminderBusy || Boolean(reminderSetAt) || !reminderAvailable ? 0.55 : 1,
                      },
                    ]}
                    className="active:opacity-80">
                    <Text
                      style={[
                        styles.linkBtnText,
                        {
                          color: reminderSetAt || !reminderAvailable ? '#6C6C6C' : '#048AF3',
                        },
                      ]}>
                      {reminderBusy ? 'Setting reminder…' : reminderLinkLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.divider} />
              <AppointmentImportantNote />
            </View>
          </View>
        ) : (
          <View style={styles.block}>
            <View style={styles.pendingHeader}>
              <View style={styles.header}>
                <AppointmentBookedCheckIcon size={96} animateCheck />
                <Text style={styles.title}>Appointment Created</Text>
                <Text style={styles.subtitle}>
                  {'Your appointment request was submitted.\nA provider will confirm it shortly.'}
                </Text>
              </View>

              <AppointmentBookedCard
                doctorName={name}
                specialtyLabel={specialty}
                photoUrl={photoUrl}
                dateLabel={dateLabel}
                timeLabel={time}
                visitReason={visitReason}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add to calendar"
                disabled={calendarBusy}
                onPress={() => void handleAddToCalendar()}
                style={[styles.primaryBtn, { opacity: calendarBusy ? 0.7 : 1 }]}
                className="active:opacity-90">
                <Text style={styles.primaryBtnText}>Add to Calendar</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel appointment"
                disabled={cancelBusy || !appointmentId}
                onPress={requestCancel}
                style={[
                  styles.secondaryBtn,
                  { opacity: cancelBusy || !appointmentId ? 0.55 : 1 },
                ]}
                className="active:opacity-80">
                <Text style={styles.secondaryBtnText}>
                  {cancelBusy ? 'Cancelling…' : 'Cancel Appointment'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  block: {
    alignItems: 'center',
    gap: 28,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  pendingHeader: {
    alignItems: 'center',
    gap: 28,
    width: '100%',
  },
  title: {
    fontFamily: Inter.medium,
    fontSize: 28,
    color: '#222222',
    letterSpacing: -2,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Inter.regular,
    fontSize: 17,
    color: '#727272',
    letterSpacing: -0.5,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    gap: 16,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 48,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: Inter.medium,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight: 18,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: Inter.medium,
    fontSize: 17,
    color: '#6C6C6C',
    letterSpacing: -1.2,
    lineHeight: 18,
  },
  linkBtn: {
    height: 48,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnText: {
    fontFamily: Inter.regular,
    fontSize: 17,
    letterSpacing: -0.6,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    width: '100%',
  },
});
