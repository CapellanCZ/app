import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppointmentBookedCard } from '@/components/booking/AppointmentBookedCard';
import { AppointmentBookedCheckIcon } from '@/components/booking/AppointmentBookedCheckIcon';
import { AppointmentImportantNote } from '@/components/booking/AppointmentImportantNote';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showAppToast } from '@/lib/ui/toastBridge';
import { playToastFeedback } from '@/lib/ui/feedbackSound';
import {
  appointmentReminderAt,
  buildGoogleCalendarUrl,
  estimateEndLabel,
  formatAppointmentBookedDate,
  formatClinicDayMonth,
  formatClinicTime,
} from '@/lib/health-service/appointmentDisplay';
import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { notifyAppointmentCancelled } from '@/lib/notifications/appointmentNotifications';
import { Inter } from '@/lib/typography/inter';

const REMINDER_MINUTES_BEFORE = 30;
const CLINIC_LOCATION = 'CampusCare Student Health Clinic';

/**
 * Booking / confirmation success.
 * - pending (just booked): Figma 2248:5
 * - confirmed: Figma 2249:271
 * - cancelled: no success page (redirect away)
 */
export default function AppointmentBookedScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderSetAt, setReminderSetAt] = useState<Date | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [queueNumberLabel, setQueueNumberLabel] = useState<string | null>(null);
  const {
    id,
    doctorName,
    specialtyLabel,
    photoUrl,
    appointmentDate,
    appointmentTime,
    dateKey,
    status,
    reason,
  } = useLocalSearchParams<{
    id?: string;
    doctorName?: string;
    specialtyLabel?: string;
    photoUrl?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    dateKey?: string;
    status?: string;
    reason?: string;
  }>();

  const appointments = useHealthServiceStore((s) => s.appointments);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const cancelAppointment = useHealthServiceStore((s) => s.cancelAppointment);
  const storeAppointment = useMemo(() => {
    const appointmentId = id ? String(id) : '';
    if (!appointmentId) return null;
    return appointments.find((a) => a.id === appointmentId) ?? null;
  }, [appointments, id]);

  const storeReason = storeAppointment?.reason ?? null;

  const visitReason = useMemo(
    () => formatVisitReasonDisplay(reason || storeReason),
    [reason, storeReason],
  );

  const statusNorm = String(status ?? storeAppointment?.status ?? '').toLowerCase();
  const isCancelled = statusNorm === 'cancelled' || storeAppointment?.status === 'cancelled';
  // Prefer live store once realtime updates arrive (URL params can stay stale as "pending").
  const isConfirmed =
    storeAppointment?.status === 'confirmed' ||
    statusNorm === 'confirmed' ||
    statusNorm === 'in_progress';

  useEffect(() => {
    // Keep status/queue in sync when admin confirms while this screen is open.
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (isCancelled) {
      router.replace('/appointments');
    }
  }, [isCancelled]);

  useEffect(() => {
    if (isCancelled) return;
    void playToastFeedback('success');
  }, [isCancelled]);

  useEffect(() => {
    const appointmentId = id ? String(id) : '';
    if (!appointmentId || !isConfirmed) {
      setQueueNumberLabel(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const ticket = await healthServiceApi.getQueueTicketForAppointment(appointmentId);
        if (cancelled) return;
        setQueueNumberLabel(ticket ? `${ticket.position}#` : null);
      } catch (error) {
        console.warn('[queue] fetch failed:', error);
        if (!cancelled) setQueueNumberLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isConfirmed, storeAppointment?.status]);

  const name = doctorName?.trim() || 'Clinic staff';
  const specialty = specialtyLabel?.trim() || 'Campus Clinic';
  const time = appointmentTime?.trim() || '—';
  const dateLabel =
    (dateKey ? formatAppointmentBookedDate(String(dateKey)) : null) ||
    appointmentDate?.trim() ||
    '—';
  // EST finish only when confirmed — pending shows start time alone.
  const estDoneLabel = isConfirmed && appointmentTime ? estimateEndLabel(String(appointmentTime)) : null;

  const reminderAt = useMemo(() => {
    if (!dateKey || !appointmentTime) return null;
    return appointmentReminderAt(String(dateKey), String(appointmentTime), REMINDER_MINUTES_BEFORE);
  }, [appointmentTime, dateKey]);

  const reminderAvailable = Boolean(reminderAt && reminderAt.getTime() > Date.now());

  const reminderLinkLabel = useMemo(() => {
    if (reminderSetAt) {
      return `Reminder set for ${formatClinicTime(reminderSetAt)} →`;
    }
    if (!reminderAt) return 'Get a reminder 30 minutes before →';
    return `Get a reminder at ${formatClinicTime(reminderAt)} (${formatClinicDayMonth(reminderAt)}) →`;
  }, [reminderAt, reminderSetAt]);

  /** Hide the reminder row once the appointment is within 30 minutes (unless already set). */
  const showReminder = Boolean(reminderSetAt || reminderAvailable);

  const requestCancel = useCallback(() => {
    const appointmentId = id ? String(id) : '';
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
  }, [cancelAppointment, cancelBusy, id, name, session?.user?.id]);

  const handleAddToCalendar = useCallback(async () => {
    if (!dateKey || !appointmentTime || calendarBusy) return;

    const url = buildGoogleCalendarUrl({
      title: `CampusCare · ${name}`,
      dateKey: String(dateKey),
      startLabel: String(appointmentTime),
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
  }, [appointmentTime, calendarBusy, dateKey, dateLabel, name, specialty, time]);

  const handleReminder = useCallback(async () => {
    if (!dateKey || !appointmentTime || reminderBusy || reminderSetAt) return;
    if (!reminderAvailable) {
      showAppToast({
        variant: 'accent',
        placement: 'top',
        label: 'Too close to start',
        description: `Your appointment is at ${time}. Reminders need at least ${REMINDER_MINUTES_BEFORE} minutes beforehand.`,
      });
      return;
    }

    const appointmentId = id ? String(id) : '';
    if (!appointmentId) {
      showAppToast({
        variant: 'danger',
        placement: 'top',
        label: 'Could not set reminder',
        description: 'Missing appointment id.',
      });
      return;
    }

    const fireAt = appointmentReminderAt(
      String(dateKey),
      String(appointmentTime),
      REMINDER_MINUTES_BEFORE,
    );
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
    appointmentTime,
    dateKey,
    dateLabel,
    id,
    name,
    reminderAvailable,
    reminderBusy,
    reminderSetAt,
    time,
  ]);

  if (isCancelled) {
    return <View style={{ flex: 1, backgroundColor: '#F9F9F9' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
          paddingHorizontal: 20,
          gap: 39,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="active:opacity-80">
          <Ionicons name="close" size={24} color="#6C6C6C" />
        </Pressable>

        {isConfirmed ? (
          <View style={{ alignItems: 'center', gap: 39, width: '100%' }}>
            <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
              <AppointmentBookedCheckIcon size={111} animateCheck />
              <Text
                style={{
                  fontFamily: Inter.medium,
                  fontSize: 30,
                  color: '#222222',
                  letterSpacing: -2.24,
                  lineHeight: 40,
                  textAlign: 'center',
                }}>
                You’re all set!
              </Text>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 18,
                  color: '#727272',
                  letterSpacing: -0.64,
                  lineHeight: 22,
                  textAlign: 'center',
                }}>
                {'Your appointment has been successfully\nscheduled and confirmed.'}
              </Text>
            </View>

            <View style={{ width: '100%', gap: 20 }}>
              <AppointmentBookedCard
                doctorName={name}
                specialtyLabel={specialty}
                photoUrl={photoUrl}
                dateLabel={dateLabel}
                timeLabel={time}
                estDoneLabel={estDoneLabel}
                showQueueRow
                queueNumberLabel={queueNumberLabel}
                visitReason={visitReason}
              />

              <View style={{ width: '100%', gap: 12 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add to calendar"
                  disabled={calendarBusy}
                  onPress={() => void handleAddToCalendar()}
                  style={{
                    height: 48,
                    borderRadius: 48,
                    backgroundColor: '#000000',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: calendarBusy ? 0.7 : 1,
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
                    Add to Calendar
                  </Text>
                </Pressable>

                {showReminder ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={reminderLinkLabel}
                    disabled={reminderBusy || Boolean(reminderSetAt) || !reminderAvailable}
                    onPress={() => void handleReminder()}
                    style={{
                      height: 48,
                      borderRadius: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: reminderBusy || Boolean(reminderSetAt) || !reminderAvailable ? 0.55 : 1,
                    }}
                    className="active:opacity-80">
                    <Text
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 17,
                        color: reminderSetAt || !reminderAvailable ? '#6C6C6C' : '#048AF3',
                        letterSpacing: -0.6,
                        lineHeight: 18,
                        textAlign: 'center',
                        paddingHorizontal: 8,
                      }}>
                      {reminderBusy ? 'Setting reminder…' : reminderLinkLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={{ height: 1, backgroundColor: '#EFEFEF', width: '100%' }} />

              <AppointmentImportantNote />
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 39, width: '100%' }}>
            <View style={{ alignItems: 'center', gap: 28, width: '100%' }}>
              <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
                <AppointmentBookedCheckIcon size={111} animateCheck />
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 30,
                    color: '#222222',
                    letterSpacing: -2.24,
                    lineHeight: 40,
                    textAlign: 'center',
                  }}>
                  Appointment Created
                </Text>
                <Text
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 18,
                    color: '#727272',
                    letterSpacing: -0.64,
                    lineHeight: 22,
                    textAlign: 'center',
                  }}>
                  {
                    'Your appointment request was submitted.\nA provider will confirm it shortly.'
                  }
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

            <View style={{ width: '100%', gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add to calendar"
                disabled={calendarBusy}
                onPress={() => void handleAddToCalendar()}
                style={{
                  height: 48,
                  borderRadius: 48,
                  backgroundColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: calendarBusy ? 0.7 : 1,
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
                  Add to Calendar
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel appointment"
                disabled={cancelBusy || !id}
                onPress={requestCancel}
                style={{
                  height: 48,
                  borderRadius: 48,
                  borderWidth: 1,
                  borderColor: '#E3E3E3',
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: cancelBusy || !id ? 0.55 : 1,
                }}
                className="active:opacity-80">
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 17,
                    color: '#6C6C6C',
                    letterSpacing: -1.2,
                    lineHeight: 18,
                  }}>
                  {cancelBusy ? 'Cancelling…' : 'Cancel Appointment'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
