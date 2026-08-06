import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from 'heroui-native';

import { BookingHero } from '@/components/booking/BookingHero';
import {
  BookingCommentsField,
  BookingConsultationSelect,
  buildBookingReason,
  type ConsultationRequestOption,
} from '@/components/booking/BookingConsultationFields';
import {
  BookingDayChip,
  BookingPrimaryButton,
  BookingSheetHeader,
  BookingSlotChip,
} from '@/components/booking/BookingSheetParts';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  formatAppointmentBookedDate,
} from '@/lib/health-service/appointmentDisplay';
import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { StaffRole } from '@/lib/health-service/types';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { Inter } from '@/lib/typography/inter';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type SlotItem = {
  label: string;
  booked: boolean;
};

const NOON_MINUTES = 12 * 60;

/** Parse "10:40 AM" → minutes from midnight. */
function slotLabelToMinutes(label: string): number {
  const [time, period] = label.split(' ');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours, 10);
  if (period === 'PM' && hour24 !== 12) hour24 += 12;
  else if (period === 'AM' && hour24 === 12) hour24 = 0;
  return hour24 * 60 + (parseInt(minutes, 10) || 0);
}

function chunkSlots(items: SlotItem[], size = 3): SlotItem[][] {
  const rows: SlotItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isPastDay(day: Date): boolean {
  return startOfDay(day).getTime() < startOfDay(new Date()).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function getWeekDays(anchor: Date): Date[] {
  const s = startOfDay(anchor);
  const dow = s.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(s);
  mon.setDate(s.getDate() + daysToMon);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

/** True when every day in the Mon–Sat week of `anchor` is already past. */
function isWeekFullyPast(anchor: Date): boolean {
  const days = getWeekDays(anchor);
  const last = days[days.length - 1];
  return last ? isPastDay(last) : true;
}

function resolveSpecialty(role: StaffRole, _specialty: string): string {
  if (role === 'doctor') return 'School Physician';
  if (role === 'dentist') return 'School Dentist';
  if (role === 'nurse') return 'School Nurse';
  return 'Clinic Staff';
}

/** Figma-style display name: "Dr. Catherine Capellan, MD" */
function formatDoctorDisplayName(name: string, role: StaffRole): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, '').trim();
  if (!cleaned) return 'CampusCare Provider';

  if (role === 'doctor') {
    return cleaned.match(/,\s*MD\b/i) ? `Dr. ${cleaned}` : `Dr. ${cleaned}, MD`;
  }
  if (role === 'dentist') {
    return cleaned.match(/,\s*DMD\b/i) ? `Dr. ${cleaned}` : `Dr. ${cleaned}`;
  }
  return cleaned;
}

function formatAppointmentDate(date: Date): string {
  const dayName = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][date.getDay()];
  return `${dayName}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Book appointment — Figma node 2235:1557.
 * Slots come from Supabase `doctor_availability` for the selected day.
 */
export default function HealthServiceBookScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const { staff: allStaff, loadStaff } = useHealthServiceStore();
  const { session } = useAuth();
  const { toast } = useToast();

  /** Room for date, slots, consultation fields, and CTA. */
  const sheetHeight = Math.round(screenH * 0.62);

  const staff = useMemo(
    () => (staffId ? allStaff.find((s) => s.id === staffId) : undefined),
    [staffId, allStaff],
  );

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationRequest, setConsultationRequest] =
    useState<ConsultationRequestOption | null>(null);
  const [comments, setComments] = useState('');
  const [showRequestError, setShowRequestError] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [working, setWorking] = useState(false);
  const [hoursLabel, setHoursLabel] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  /** Days of week (0–6) this doctor has an active schedule. */
  const [workingDows, setWorkingDows] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (!allStaff.length) void loadStaff();
  }, [allStaff.length, loadStaff]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkingDays() {
      if (!staff) {
        setWorkingDows(new Set());
        return;
      }
      try {
        const days = await healthServiceApi.getWorkingDaysOfWeek(staff.id);
        if (!cancelled) setWorkingDows(new Set(days));
      } catch (error) {
        console.error('Failed to load working weekdays:', error);
        if (!cancelled) setWorkingDows(new Set());
      }
    }

    void loadWorkingDays();
    return () => {
      cancelled = true;
    };
  }, [staff]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!staff) {
        setWorking(false);
        setHoursLabel(null);
        setSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const daySlots = await healthServiceApi.getDaySlots(staff.id, selectedDay);
        if (cancelled) return;

        setWorking(daySlots.working);
        setHoursLabel(daySlots.hoursLabel);
        setSlots(daySlots.slots);
      } catch (error) {
        console.error('Failed to load staff availability:', error);
        if (!cancelled) {
          setWorking(false);
          setHoursLabel(null);
          setSlots([]);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [staff, selectedDay]);

  useEffect(() => {
    if (selectedSlot && !slots.some((s) => s.label === selectedSlot && !s.booked)) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, slots]);

  const weekDays = useMemo(() => getWeekDays(selectedDay), [selectedDay]);

  const isDayBookable = useCallback(
    (day: Date) => {
      // Past calendar days are never selectable.
      if (isPastDay(day)) return false;
      if (workingDows.size === 0) return false;
      return workingDows.has(day.getDay());
    },
    [workingDows],
  );

  // If selected day is past or off-schedule, jump to the next bookable day.
  useEffect(() => {
    if (!staff || workingDows.size === 0) return;
    if (isDayBookable(selectedDay)) return;

    const inWeek = weekDays.find((d) => isDayBookable(d));
    if (inWeek) {
      setSelectedDay(startOfDay(inWeek));
      return;
    }

    // Current week has nothing left — jump to today (or next week’s first bookable).
    const fromToday = startOfDay(new Date());
    if (isDayBookable(fromToday)) {
      setSelectedDay(fromToday);
      return;
    }
    const upcoming = getWeekDays(fromToday).find((d) => isDayBookable(d));
    if (upcoming) setSelectedDay(startOfDay(upcoming));
  }, [staff, workingDows, selectedDay, weekDays, isDayBookable]);

  const shiftWeek = (delta: number) => {
    setSelectedDay((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      const nextDay = startOfDay(next);

      // Don't navigate into a week that is entirely in the past.
      if (delta < 0 && isWeekFullyPast(nextDay)) {
        return prev;
      }

      return nextDay;
    });
  };

  const handleBookAppointment = useCallback(async () => {
    if (!staff || !selectedSlot || isBooking) return;
    if (!consultationRequest) {
      setShowRequestError(true);
      toast.show({
        variant: 'accent',
        placement: 'top',
        duration: 3500,
        label: 'Consultation request needed',
        description: 'Select why you are visiting before booking.',
      });
      return;
    }

    const doctorLabel = formatDoctorDisplayName(staff.name, staff.role);
    const dayKey = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
    const reason = buildBookingReason(consultationRequest, comments);
    setIsBooking(true);
    try {
      const {
        id: appointmentId,
        status: bookedStatus,
      } = await healthServiceApi.bookAppointment({
        staffId: staff.id,
        day: selectedDay,
        startLabel: selectedSlot,
        symptoms: reason,
      });

      useHealthServiceStore.getState().loadAppointments();

      const isAutoConfirmed = bookedStatus === 'confirmed';

      if (isAutoConfirmed) {
        useNotificationStore.getState().notifySelf(session?.user?.id, {
          category: 'health',
          title: "You're All Set",
          body: `Your appointment with ${doctorLabel} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} has been confirmed.`,
          href: `/health-service/appointment/${appointmentId}`,
          source: 'Health Service',
          notificationType: 'success',
        });
      } else {
        useNotificationStore.getState().notifySelf(session?.user?.id, {
          category: 'health',
          title: 'Appointment Pending',
          body: `Your request with ${doctorLabel} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} was submitted. Please wait for confirmation.`,
          href: '/(tabs)/appointments',
          source: 'Health Service',
          notificationType: 'info',
        });
      }

      router.replace({
        pathname: '/health-service/appointment-booked',
        params: {
          id: appointmentId,
          doctorName: doctorLabel,
          specialtyLabel: resolveSpecialty(staff.role, staff.specialtyLabel),
          photoUrl: staff.photoUrl ?? '',
          appointmentDate: formatAppointmentBookedDate(dayKey),
          appointmentTime: selectedSlot,
          dateKey: dayKey,
          status: isAutoConfirmed ? 'confirmed' : 'pending',
        },
      });
    } catch (error) {
      console.error('Failed to book appointment:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      const isSameDay =
        message.includes('already have an appointment on this day');
      toast.show({
        variant: isSameDay ? 'accent' : 'danger',
        placement: 'top',
        duration: 4500,
        label: isSameDay ? 'Already booked today' : 'Booking failed',
        description: message,
      });
    } finally {
      setIsBooking(false);
    }
  }, [staff, selectedSlot, selectedDay, consultationRequest, comments, isBooking, session, toast]);

  if (!staff) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9F9F9', alignItems: 'center', justifyContent: 'center' }}>
        {allStaff.length === 0 ? (
          <ActivityIndicator color="#111" />
        ) : (
          <View style={{ paddingHorizontal: 32, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: Inter.regular, color: '#6C6C6C', textAlign: 'center' }}>
              Provider not found.
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontFamily: Inter.medium, color: '#111' }}>Go back</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  const specLabel = resolveSpecialty(staff.role, staff.specialtyLabel);
  const displayName = formatDoctorDisplayName(staff.name, staff.role);
  const monthLabel = `Month of ${MONTH_LONG[selectedDay.getMonth()]}`;
  const canBook = Boolean(selectedSlot) && Boolean(consultationRequest) && working && !isBooking;
  const openSlots = slots.filter((s) => !s.booked);
  const openCount = openSlots.length;

  const morningSlots = openSlots.filter((s) => slotLabelToMinutes(s.label) < NOON_MINUTES);
  const afternoonSlots = openSlots.filter((s) => slotLabelToMinutes(s.label) >= NOON_MINUTES);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Hero fills remaining space above sheet — model stuck at top (get-started pattern) */}
      <BookingHero
        doctorName={displayName}
        specialty={specLabel}
        onBack={() => router.back()}
      />

      {/* Fixed-height sheet at bottom — overlaps hero; top padding for breathing room */}
      <View
        style={{
          height: sheetHeight,
          marginTop: -36,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 20,
          paddingTop: 28,
          paddingBottom: Math.max(insets.bottom, 16),
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 12,
          zIndex: 3,
        }}>
          <View style={{ gap: 16, flexShrink: 1, flex: 1 }}>
            <View style={{ gap: 12 }}>
              <BookingSheetHeader
                monthLabel={monthLabel}
                onPrevWeek={() => shiftWeek(-1)}
                onNextWeek={() => shiftWeek(1)}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {weekDays.map((day) => {
                  const past = isPastDay(day);
                  const bookable = isDayBookable(day);
                  return (
                    <BookingDayChip
                      key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                      weekday={DAY_SHORT[day.getDay()]}
                      dayNumber={String(day.getDate()).padStart(2, '0')}
                      selected={isSameDay(day, selectedDay)}
                      disabled={past || !bookable}
                      onPress={() => {
                        if (past || !bookable) return;
                        setSelectedDay(startOfDay(day));
                      }}
                    />
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 10, flex: 1, minHeight: 0 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 20,
                    color: '#111111',
                    letterSpacing: -1.6,
                    lineHeight: 28,
                    flexShrink: 1,
                  }}>
                  Available Slots
                </Text>
                {working && hoursLabel ? (
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 12,
                      color: '#6C6C6C',
                      letterSpacing: -0.24,
                      flexShrink: 1,
                      textAlign: 'right',
                    }}
                    numberOfLines={2}>
                    {hoursLabel}
                  </Text>
                ) : !working && !loadingSlots ? (
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 12,
                      color: '#A7A7A7',
                      letterSpacing: -0.24,
                    }}>
                    Not available
                  </Text>
                ) : null}
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled">
                {!working ? (
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 14,
                      color: '#6C6C6C',
                      letterSpacing: -0.28,
                    }}>
                    No clinic hours on this day. Pick another date.
                  </Text>
                ) : loadingSlots ? (
                  <ActivityIndicator color="#111" style={{ marginVertical: 8 }} />
                ) : openCount === 0 ? (
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 14,
                      color: '#6C6C6C',
                      letterSpacing: -0.28,
                    }}>
                    No open slots left for this day.
                  </Text>
                ) : (
                  (
                    [
                      { title: 'Morning', items: morningSlots },
                      { title: 'Afternoon', items: afternoonSlots },
                    ] as const
                  ).map((section) => {
                    if (section.items.length === 0) return null;
                    return (
                      <View key={section.title} style={{ gap: 8 }}>
                        <Text
                          style={{
                            fontFamily: Inter.medium,
                            fontSize: 14,
                            color: '#6C6C6C',
                            letterSpacing: -0.28,
                          }}>
                          {section.title}
                        </Text>
                        {chunkSlots(section.items).map((row, rowIndex) => (
                          <View
                            key={`${section.title}-${rowIndex}`}
                            style={{ flexDirection: 'row', gap: 10 }}>
                            {row.map((slot) => (
                              <BookingSlotChip
                                key={slot.label}
                                label={slot.label}
                                selected={selectedSlot === slot.label}
                                booked={slot.booked}
                                onPress={() => setSelectedSlot(slot.label)}
                              />
                            ))}
                            {row.length < 3
                              ? Array.from({ length: 3 - row.length }).map((_, i) => (
                                  <View key={`pad-${i}`} style={{ flex: 1, flexBasis: 0 }} />
                                ))
                              : null}
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}

                <BookingConsultationSelect
                  value={consultationRequest}
                  error={showRequestError && !consultationRequest}
                  onChange={(next) => {
                    setConsultationRequest(next);
                    setShowRequestError(false);
                  }}
                />
                <BookingCommentsField value={comments} onChange={setComments} />
              </ScrollView>
            </View>
          </View>

          <BookingPrimaryButton
            disabled={!canBook}
            loading={isBooking}
            onPress={() => void handleBookAppointment()}
          />
        </View>
    </View>
  );
}
