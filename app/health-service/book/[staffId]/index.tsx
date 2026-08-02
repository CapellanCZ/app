import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from 'heroui-native';

import { BookingHero } from '@/components/booking/BookingHero';
import {
  BookingChooseTimeRow,
  BookingDayChip,
  BookingPrimaryButton,
  BookingSheetHeader,
  BookingSlotChip,
} from '@/components/booking/BookingSheetParts';
import { useAuth } from '@/lib/auth/AuthProvider';
import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { SlotPeriod, StaffRole } from '@/lib/health-service/types';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { Inter } from '@/lib/typography/inter';

const PERIODS: SlotPeriod[] = ['morning', 'afternoon', 'evening'];

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

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
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

function sortSlotLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const toMin = (label: string) => {
      const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
      if (!m) return 0;
      let h = Number(m[1]);
      const min = Number(m[2]);
      const p = m[3].toUpperCase();
      if (p === 'PM' && h < 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return h * 60 + min;
    };
    return toMin(a) - toMin(b);
  });
}

/**
 * Book appointment — Figma node 2235:1557.
 */
export default function HealthServiceBookScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const { staff: allStaff, loadStaff } = useHealthServiceStore();
  const { session } = useAuth();
  const { toast } = useToast();

  /** Fixed sheet height so the hero/model area stays consistent. */
  const sheetHeight = Math.round(screenH * 0.51);

  const staff = useMemo(
    () => (staffId ? allStaff.find((s) => s.id === staffId) : undefined),
    [staffId, allStaff],
  );

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [working, setWorking] = useState(false);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!allStaff.length) void loadStaff();
  }, [allStaff.length, loadStaff]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!staff) {
        setWorking(false);
        setSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const [isWorkingToday, ...periodLabels] = await Promise.all([
          healthServiceApi.isWorking(staff.id, selectedDay),
          ...PERIODS.map((period) =>
            healthServiceApi.getOpenSlotLabels(staff.id, selectedDay, period),
          ),
        ]);

        if (cancelled) return;

        setWorking(isWorkingToday);
        const open = sortSlotLabels([...new Set(periodLabels.flat())]);
        setSlots(open.map((label) => ({ label, booked: false })));
      } catch (error) {
        console.error('Failed to load staff availability:', error);
        if (!cancelled) {
          setWorking(false);
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

  const shiftWeek = (delta: number) => {
    setSelectedDay((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return startOfDay(next);
    });
  };

  const handleBookAppointment = useCallback(async () => {
    if (!staff || !selectedSlot || isBooking) return;

    const doctorLabel = formatDoctorDisplayName(staff.name, staff.role);
    setIsBooking(true);
    try {
      const {
        id: appointmentId,
        checkInCode,
        createdAt: bookedAt,
      } = await healthServiceApi.bookAppointment({
        staffId: staff.id,
        day: selectedDay,
        startLabel: selectedSlot,
        symptoms: 'Clinic consultation',
      });

      useHealthServiceStore.getState().loadAppointments();
      toast.show({
        variant: 'success',
        placement: 'top',
        duration: 5000,
        label: 'Appointment Booked!',
        description: `Your appointment with ${doctorLabel} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} is confirmed.`,
        icon: (
          <View style={{ paddingTop: 2 }}>
            <Ionicons name="checkmark-circle" size={26} color="#079455" />
          </View>
        ),
      });
      router.replace({
        pathname: '/health-service/appointment-booked',
        params: {
          id: appointmentId,
          doctorName: doctorLabel,
          appointmentDate: formatAppointmentDate(selectedDay),
          appointmentTime: selectedSlot,
          checkInCode,
          expiresAt: new Date(new Date(bookedAt).getTime() + 60 * 60 * 1000).toISOString(),
        },
      });
      useNotificationStore.getState().notifySelf(session?.user?.id, {
        category: 'health',
        title: 'Appointment Booked',
        body: `Your appointment with ${doctorLabel} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} has been successfully booked.`,
        href: '/(tabs)/appointments',
        source: 'Health Service',
        notificationType: 'success',
      });
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.show({
        variant: 'danger',
        placement: 'top',
        duration: 4000,
        label: 'Booking failed',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsBooking(false);
    }
  }, [staff, selectedSlot, selectedDay, isBooking, session, toast]);

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
  const visibleSlots = slots.slice(0, 6);
  const canBook = Boolean(selectedSlot) && working && !isBooking;

  const slotRows: SlotItem[][] = [];
  for (let i = 0; i < visibleSlots.length; i += 3) {
    slotRows.push(visibleSlots.slice(i, i + 3));
  }

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
          <View style={{ gap: 16, flexShrink: 1 }}>
            <View style={{ gap: 12 }}>
              <BookingSheetHeader
                monthLabel={monthLabel}
                onPrevWeek={() => shiftWeek(-1)}
                onNextWeek={() => shiftWeek(1)}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {weekDays.map((day) => (
                  <BookingDayChip
                    key={day.toISOString()}
                    weekday={DAY_SHORT[day.getDay()]}
                    dayNumber={String(day.getDate()).padStart(2, '0')}
                    selected={isSameDay(day, selectedDay)}
                    onPress={() => setSelectedDay(startOfDay(day))}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <Text
                style={{
                  fontFamily: Inter.medium,
                  fontSize: 20,
                  color: '#111111',
                  letterSpacing: -1.6,
                  lineHeight: 28,
                }}>
                Available Slots
              </Text>

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
              ) : visibleSlots.length === 0 ? (
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
                slotRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', gap: 10 }}>
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
                ))
              )}

              <BookingChooseTimeRow />
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
