import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { BookingHero, BookingProviderCard } from '@/components/booking/BookingHero';
import {
  BookingCommentsField,
  BookingConsultationSelect,
  buildBookingReason,
  type ConsultationRequestOption,
} from '@/components/booking/BookingConsultationFields';
import {
  BookingProviderTypeSelect,
  type BookingProviderType,
} from '@/components/booking/BookingProviderTypeSelect';
import { BookingSectionCard } from '@/components/booking/BookingSectionCard';
import {
  BookingDayChip,
  BookingPeriodSection,
  BookingPrimaryButton,
  BookingSheetHeader,
} from '@/components/booking/BookingSheetParts';
import {
  BookingScreenSkeleton,
  BookingSlotsSkeleton,
} from '@/components/booking/BookingSlotsSkeleton';
import { IconsaxCalendar2Icon } from '@/components/icons/IconsaxCalendar2Icon';
import { IconsaxClipboardTextIcon } from '@/components/icons/IconsaxClipboardTextIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import { IconsaxProfile2UserIcon } from '@/components/icons/IconsaxProfile2UserIcon';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useAppointmentStatusStore } from '@/lib/health-service/appointmentStatusStore';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { StaffRole } from '@/lib/health-service/types';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { Inter } from '@/lib/typography/inter';
import { showAppToast } from '@/lib/ui/toastBridge';

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

/** Figma-style display name: "Dr. Name, MD" / "Dr. Name, DMD". */
function formatDoctorDisplayName(name: string, role: StaffRole): string {
  const cleaned = name
    .replace(/^Dr\.?\s*/i, '')
    .replace(/,?\s*\b(MD|DMD|DDS|DDM|DO|DPM|PhD|RN|NP|PA-?C?)\b\.?/gi, '')
    .replace(/\s*,\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!cleaned) return 'CampusCare Provider';

  if (role === 'doctor') return `Dr. ${cleaned}, MD`;
  if (role === 'dentist') return `Dr. ${cleaned}, DMD`;
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
 * Book appointment — compact header + scrollable schedule section.
 * Slots come from Supabase `doctor_availability` for the selected day.
 */
export type HealthServiceBookScreenProps = {
  initialStaffId?: string;
  onBack?: () => void;
  /** Extra bottom inset when rendered inside the Book (+) tab. */
  embeddedInTab?: boolean;
};

export function HealthServiceBookScreen({
  initialStaffId,
  onBack,
  embeddedInTab = false,
}: HealthServiceBookScreenProps = {}) {
  const { staffId: routeStaffIdParam } = useLocalSearchParams<{ staffId: string }>();
  const routeStaffId = initialStaffId ?? routeStaffIdParam;
  const insets = useSafeAreaInsets();
  const { staff: allStaff, loadStaff } = useHealthServiceStore();
  const { session } = useAuth();

  const bottomPad =
    Math.max(insets.bottom, 16) + (embeddedInTab ? TAB_BAR_HEIGHT : 0);

  const handleBack = onBack ?? (() => router.back());

  const [activeStaffId, setActiveStaffId] = useState(() => routeStaffId ?? '');

  useEffect(() => {
    if (routeStaffId) setActiveStaffId(routeStaffId);
  }, [routeStaffId]);

  const staff = useMemo(
    () => (activeStaffId ? allStaff.find((s) => s.id === activeStaffId) : undefined),
    [activeStaffId, allStaff],
  );

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationRequest, setConsultationRequest] =
    useState<ConsultationRequestOption | null>(null);
  const [comments, setComments] = useState('');
  const [showRequestError, setShowRequestError] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [working, setWorking] = useState(false);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  /** Days of week (0–6) this doctor has an active schedule. */
  const [workingDows, setWorkingDows] = useState<Set<number>>(() => new Set());

  const scrollRef = useRef<ScrollView>(null);

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
        setSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const daySlots = await healthServiceApi.getDaySlots(staff.id, selectedDay);
        if (cancelled) return;

        setWorking(daySlots.working);
        setSlots(daySlots.slots);
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

  const isDayBookable = useCallback(
    (day: Date) => {
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
      showAppToast({
        variant: 'accent',
        placement: 'top',
        duration: 3500,
        label: 'Consultation request needed',
        description: 'Select why you are visiting before booking.',
      });
      return;
    }

    const doctorLabel = formatDoctorDisplayName(staff.name, staff.role);
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

      await useHealthServiceStore.getState().loadAppointments();

      const isAutoConfirmed = bookedStatus === 'confirmed';

      if (!isAutoConfirmed) {
        await useNotificationStore.getState().notifySelf(session?.user?.id, {
          category: 'health',
          title: 'Appointment Pending',
          body: `Your request with ${doctorLabel} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} was submitted. Please wait for confirmation.`,
          href: '/appointments',
          source: 'Health Service',
          notificationType: 'info',
        });
      }

      useAppointmentStatusStore.getState().open(appointmentId);
      router.replace('/appointments');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      const isSameDayConflict = message.includes('already have an appointment on this day');
      if (!isSameDayConflict) {
        console.error('Failed to book appointment:', error);
      }
      showAppToast({
        variant: isSameDayConflict ? 'accent' : 'danger',
        placement: 'top',
        duration: 4500,
        label: isSameDayConflict ? 'Already booked today' : 'Booking failed',
        description: message,
      });
    } finally {
      setIsBooking(false);
    }
  }, [staff, selectedSlot, selectedDay, consultationRequest, comments, isBooking, session]);

  const scrollCommentsIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 80 : 120);
    });
  }, []);

  const handleProviderTypeChange = useCallback(
    (next: BookingProviderType) => {
      const currentRole = staff?.role === 'dentist' ? 'dentist' : 'doctor';
      if (next === currentRole) return;
      Keyboard.dismiss();
      const match = allStaff.find((s) => s.role === next);
      if (!match) {
        showAppToast({
          variant: 'accent',
          placement: 'top',
          duration: 4000,
          label: next === 'dentist' ? 'No dentist available' : 'No physician available',
          description: 'Please check back later or contact the campus clinic.',
        });
        return;
      }
      setSelectedSlot(null);
      setActiveStaffId(match.id);
    },
    [allStaff, staff?.role],
  );

  if (!staff) {
    if (allStaff.length === 0) {
      return (
        <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
          <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 8 }}>
            <CircleBackButton onPress={handleBack} />
          </View>
          <BookingScreenSkeleton />
        </View>
      );
    }

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F9F9F9',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={{ paddingHorizontal: 32, alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: Inter.regular, color: '#6C6C6C', textAlign: 'center' }}>
            Provider not found.
          </Text>
          <Pressable onPress={handleBack}>
            <Text style={{ fontFamily: Inter.medium, color: '#111' }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const specLabel = resolveSpecialty(staff.role, staff.specialtyLabel);
  const displayName = formatDoctorDisplayName(staff.name, staff.role);
  const providerType: BookingProviderType = staff.role === 'dentist' ? 'dentist' : 'doctor';
  const monthLabel = MONTH_LONG[selectedDay.getMonth()];
  const canBook = Boolean(selectedSlot) && Boolean(consultationRequest) && working && !isBooking;
  const openSlots = slots.filter((s) => !s.booked);
  const openCount = openSlots.length;

  const morningSlots = openSlots.filter((s) => slotLabelToMinutes(s.label) < NOON_MINUTES);
  const afternoonSlots = openSlots.filter((s) => slotLabelToMinutes(s.label) >= NOON_MINUTES);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <BookingHero onBack={handleBack} />

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 24,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
        onScrollBeginDrag={Keyboard.dismiss}>
        <BookingProviderCard
          doctorName={displayName}
          specialty={specLabel}
          photoUrl={staff.photoUrl}
        />

        <BookingSectionCard
          title="Date"
          tone="blue"
          icon={<IconsaxCalendar2Icon size={18} color="#048AF3" />}>
          <BookingSheetHeader
            monthLabel={monthLabel}
            onPrevWeek={() => {
              Keyboard.dismiss();
              shiftWeek(-1);
            }}
            onNextWeek={() => {
              Keyboard.dismiss();
              shiftWeek(1);
            }}
          />

          <View style={{ flexDirection: 'row', gap: 6 }}>
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
                    Keyboard.dismiss();
                    setSelectedDay(startOfDay(day));
                  }}
                />
              );
            })}
          </View>
        </BookingSectionCard>

        <BookingSectionCard
          title="Provider type"
          tone="yellow"
          icon={<IconsaxProfile2UserIcon size={18} color="#7E6B28" />}>
          <BookingProviderTypeSelect
            value={providerType}
            onChange={handleProviderTypeChange}
            hideLabel
          />
        </BookingSectionCard>

        <BookingSectionCard
          title="Time"
          tone="pink"
          icon={<IconsaxClockIcon size={18} color="#7C52A2" />}>
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
            <BookingSlotsSkeleton />
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
                <BookingPeriodSection
                  key={`${selectedDay.toDateString()}-${section.title}`}
                  title={section.title}
                  items={section.items}
                  selectedSlot={selectedSlot}
                  onSelect={(label) => {
                    Keyboard.dismiss();
                    setSelectedSlot(label);
                  }}
                  initialVisible={6}
                />
              );
            })
          )}
        </BookingSectionCard>

        <BookingSectionCard
          title="Visit details"
          tone="mint"
          icon={<IconsaxClipboardTextIcon size={18} color="#4FA603" />}>
          <BookingConsultationSelect
            value={consultationRequest}
            error={showRequestError && !consultationRequest}
            onChange={(next) => {
              Keyboard.dismiss();
              setConsultationRequest(next);
              setShowRequestError(false);
            }}
          />
          <BookingCommentsField
            value={comments}
            onChange={setComments}
            onFocus={scrollCommentsIntoView}
          />
        </BookingSectionCard>
      </KeyboardAwareScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: bottomPad,
          backgroundColor: '#F9F9F9',
        }}>
        <BookingPrimaryButton
          disabled={!canBook}
          loading={isBooking}
          onPress={() => {
            Keyboard.dismiss();
            void handleBookAppointment();
          }}
        />
      </View>
    </View>
  );
}
