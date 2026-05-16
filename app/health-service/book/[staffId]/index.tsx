import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from 'heroui-native';
import { SvgFromUri } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

import { HealthServiceScreenShell } from '../../../../components/health-service/HealthServiceScreenShell';
import { IconsaxArrowLeftIcon } from '../../../../components/icons/IconsaxArrowLeftIcon';
import { IconsaxArrowRightIcon } from '../../../../components/icons/IconsaxArrowRightIcon';
import { IconsaxVerifyIcon } from '@/components/icons/IconsaxVerifyIcon';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { useHealthServiceStore } from '../../../../lib/health-service/healthServiceStore';
import { healthServiceApi } from '../../../../lib/health-service/healthServiceApi';
import type { SlotPeriod, StaffRole } from '../../../../lib/health-service/types';

const BRAND = '#2970FF';
const BRAND_LIGHT = '#528BFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E9EAEB';
const GRAY_500 = '#717680';
const GRAY_600 = '#535862';
const GRAY_800 = '#252B37';
const STAR_FILLED_URI = Image.resolveAssetSource(
  require('../../../../assets/icons/starfilled.svg')
).uri;

const FEELING_OPTIONS = [
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'pain', label: 'Pain or Injury' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'fever', label: 'Fever' },
  { id: 'digestive', label: 'Digestive Issues' },
  { id: 'sorethroat', label: 'Soretroat' },
];

const PERIOD_TABS: { id: SlotPeriod; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

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

function resolveSpecialty(role: StaffRole, specialty: string): string {
  if (specialty) return specialty;
  if (role === 'doctor') return 'Physician';
  if (role === 'dentist') return 'General Dentist';
  return 'Nurse';
}

function initialsFromName(name: string): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

const SLIDE_KNOB_SIZE = 48;
const SLIDE_TRACK_PADDING = 4;

function BookAppointmentButton({
  onPress,
  disabled,
  isLoading,
  trackWidth,
}: {
  onPress: () => void;
  disabled: boolean;
  isLoading: boolean;
  trackWidth: number;
}) {
  const maxDrag = trackWidth - SLIDE_KNOB_SIZE - SLIDE_TRACK_PADDING * 2;
  const translateX = useSharedValue(0);
  const chevronOpacityAnim = useSharedValue(1);
  const [isSliding, setIsSliding] = useState(false);

  // Start chevron opacity animation on mount
  useEffect(() => {
    if (!disabled) {
      chevronOpacityAnim.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false
      );
    }
  }, [disabled]);

  // Animate chevrons when not sliding
  useAnimatedReaction(
    () => translateX.value,
    (current) => {
      if (current === 0 && !disabled) {
        // Start pulsing opacity animation
        chevronOpacityAnim.value = withRepeat(
          withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
          -1, // infinite
          false
        );
      } else {
        // Stop animation when sliding
        chevronOpacityAnim.value = withTiming(0.5, { duration: 200 });
      }
    }
  );

  const handleComplete = () => {
    setIsSliding(true);
    onPress();
    // Reset after delay
    setTimeout(() => {
      translateX.value = withTiming(0, { duration: 300 });
      setIsSliding(false);
    }, 500);
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !isSliding)
    .onUpdate((event) => {
      const newValue = event.translationX;
      translateX.value = Math.max(0, Math.min(newValue, maxDrag));
    })
    .onEnd(() => {
      if (translateX.value >= maxDrag * 0.7) {
        // Complete slide
        translateX.value = withSpring(maxDrag, {
          damping: 15,
          stiffness: 150,
        });
        runOnJS(handleComplete)();
      } else {
        // Snap back
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, maxDrag * 0.3], [1, 0], Extrapolate.CLAMP),
  }));

  const chevronStyle = useAnimatedStyle(() => {
    // Combine pulsing animation with slide-based fade
    const basePulseOpacity = chevronOpacityAnim.value;
    const slideFade = interpolate(
      translateX.value,
      [maxDrag * 0.5, maxDrag],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: basePulseOpacity * slideFade,
    };
  });

  return (
    <View
      style={{
        height: 56,
        backgroundColor: disabled ? '#A0BCFF' : BRAND,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: disabled ? '#A0BCFF' : BRAND_LIGHT,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {/* Background label */}
          <Animated.View
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: SLIDE_KNOB_SIZE + SLIDE_TRACK_PADDING + 16,
                paddingRight: 24,
              },
              labelStyle,
            ]}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
              Slide to Book Appointment
            </Text>
            <Animated.Text
              style={[
                {
                  fontSize: 18,
                  fontWeight: '400',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: 2,
                },
                chevronStyle,
              ]}>
              {`>>>`}
            </Animated.Text>
          </Animated.View>

          {/* Sliding knob */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: SLIDE_TRACK_PADDING,
                  width: SLIDE_KNOB_SIZE,
                  height: SLIDE_KNOB_SIZE,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                },
                knobStyle,
              ]}>
              <IconsaxArrowRightIcon size={24} color={BRAND} />
            </Animated.View>
          </GestureDetector>
        </>
      )}
    </View>
  );
}

export default function HealthServiceBookScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { staff: allStaff } = useHealthServiceStore();
  const { session } = useAuth();

  const staff = useMemo(
    () => (staffId ? allStaff.find((s) => s.id === staffId) : undefined),
    [staffId, allStaff]
  );

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [period, setPeriod] = useState<SlotPeriod>('morning');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [feelingIds, setFeelingIds] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [working, setWorking] = useState(false);
  const [slotLabels, setSlotLabels] = useState<string[]>([]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [staff?.id, staff?.photoUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!staff) {
        setWorking(false);
        setSlotLabels([]);
        return;
      }

      try {
        const [isWorkingToday, labels] = await Promise.all([
          healthServiceApi.isWorking(staff.id, selectedDay),
          healthServiceApi.getOpenSlotLabels(staff.id, selectedDay, period),
        ]);

        if (!cancelled) {
          setWorking(isWorkingToday);
          setSlotLabels(labels);
        }
      } catch (error) {
        console.error('Failed to load staff availability:', error);
        if (!cancelled) {
          setWorking(false);
          setSlotLabels([]);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [staff, selectedDay, period]);

  useEffect(() => {
    if (selectedSlot && !slotLabels.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, slotLabels]);

  const weekDays = useMemo(() => getWeekDays(selectedDay), [selectedDay]);

  const { toast } = useToast();

  const handleBookAppointment = useCallback(async () => {
    const trimmedSymptoms = symptoms.trim();
    if (!staff || !selectedSlot || !trimmedSymptoms || isBooking) return;

    setIsBooking(true);

    // Simulate booking API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create appointment
    try {
      const {
        id: appointmentId,
        checkInCode,
        createdAt: bookedAt,
      } = await healthServiceApi.bookAppointment({
        staffId: staff.id,
        day: selectedDay,
        startLabel: selectedSlot,
        symptoms: trimmedSymptoms,
      });

      setIsBooking(false);
      useHealthServiceStore.getState().loadAppointments();
      toast.show({
        variant: 'success',
        placement: 'top',
        duration: 5000,
        label: 'Appointment Booked!',
        description: `Your appointment with ${staff.name} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} is confirmed.`,
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
          doctorName: staff.name,
          appointmentDate: formatAppointmentDate(selectedDay),
          appointmentTime: selectedSlot,
          checkInCode,
          expiresAt: new Date(new Date(bookedAt).getTime() + 60 * 60 * 1000).toISOString(),
        },
      });
      useNotificationStore.getState().notifySelf(session?.user?.id, {
        category: 'health',
        title: 'Appointment Booked',
        body: `Your appointment with ${staff.name} on ${formatAppointmentDate(selectedDay)} at ${selectedSlot} has been successfully booked.`,
        href: '/health-service/appointments',
        source: 'Health Service',
        notificationType: 'success',
      });
    } catch (error) {
      setIsBooking(false);
      console.error('Failed to book appointment:', error);
    }
  }, [staff, selectedSlot, selectedDay, symptoms, isBooking, session]);

  const toggleFeeling = (id: string) => {
    const option = FEELING_OPTIONS.find((o) => o.id === id);
    if (!option) return;

    setFeelingIds((prev) => {
      const willSelect = !prev.includes(id);
      const next = willSelect ? [...prev, id] : prev.filter((x) => x !== id);

      setSymptoms((current) => {
        const tokens = current
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean);
        const lowerLabel = option.label.toLowerCase();

        if (willSelect) {
          const hasLabel = tokens.some((token) => token.toLowerCase() === lowerLabel);
          return hasLabel ? tokens.join(', ') : [...tokens, option.label].join(', ');
        }

        return tokens.filter((token) => token.toLowerCase() !== lowerLabel).join(', ');
      });

      return next;
    });
  };

  if (!staff) {
    return (
      <HealthServiceScreenShell>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}>
          <Text style={{ textAlign: 'center', color: GRAY_600 }}>Provider not found.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '600', color: BRAND }}>Go back</Text>
          </Pressable>
        </View>
      </HealthServiceScreenShell>
    );
  }

  const rating = staff.rating ?? 4.6;
  const showPhoto = Boolean(staff.photoUrl) && !avatarFailed;
  const specLabel = resolveSpecialty(staff.role, staff.specialtyLabel);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_LABELS = [
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

  const pillW = Math.floor((screenWidth - 32 - 5 * 8) / 6);
  const buttonTrackWidth = screenWidth - 32;

  const formatAppointmentDate = (date: Date) => {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      date.getDay()
    ];
    const day = date.getDate();
    const month = MONTH_LABELS[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HealthServiceScreenShell>
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 100 + Math.max(insets.bottom, 8) }}>
            {/* ─────────────── GREY HEADER CARD ─────────────── */}
            <View style={{ paddingHorizontal: 8, paddingBottom: 0 }}>
              <View
                style={{
                  backgroundColor: GRAY_100,
                  borderRadius: 32,
                  paddingTop: Math.max(insets.top, 16) + 8,
                  paddingBottom: 28,
                  paddingHorizontal: 14,
                  gap: 24,
                }}>
                {/* Back + Title */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: '#FDFDFD',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <IconsaxArrowLeftIcon size={20} color="#181D27" />
                  </Pressable>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: '500',
                      color: '#000',
                      letterSpacing: -0.48,
                    }}>
                    Book Appointment
                  </Text>
                </View>

                {/* Doctor row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: 5,
                    gap: 20,
                  }}>
                  {/* Avatar */}
                  <View
                    style={{
                      width: 108,
                      height: 108,
                      borderRadius: 999,
                      borderWidth: 4,
                      borderColor: '#FDFDFD',
                      overflow: 'hidden',
                      backgroundColor: '#D8E4F0',
                      flexShrink: 0,
                    }}>
                    {showPhoto ? (
                      <Image
                        source={{ uri: staff.photoUrl! }}
                        onError={() => setAvatarFailed(true)}
                        style={{ width: 100, height: 100 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 32, fontWeight: '700', color: BRAND }}>
                          {initialsFromName(staff.name)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, gap: 8 }}>
                    {/* Verified badge */}
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(209,224,255,0.6)',
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                      <IconsaxVerifyIcon size={16} color={BRAND} />
                      <Text style={{ fontSize: 12, color: BRAND }}>Professional Doctor</Text>
                    </View>

                    {/* Name */}
                    <View>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: '500',
                          color: GRAY_800,
                          letterSpacing: -0.96,
                        }}
                        numberOfLines={1}>
                        {staff.name}
                      </Text>
                      <Text style={{ fontSize: 14, color: GRAY_800, marginTop: 2 }}>
                        {specLabel}
                      </Text>
                    </View>

                    {/* Stars */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <View key={i} style={{ opacity: i < Math.round(rating) ? 1 : 0.28 }}>
                          <SvgFromUri width={12} height={12} uri={STAR_FILLED_URI} />
                        </View>
                      ))}
                      <Text style={{ fontSize: 12, color: GRAY_800, marginLeft: 4 }}>
                        {rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stats card */}
                <View
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 2,
                  }}>
                  {[
                    { label: 'Patient', value: '2100+' },
                    { label: 'Experience', value: '10 yrs+' },
                    { label: 'Reviews', value: '20' },
                  ].map((stat, i, arr) => (
                    <View
                      key={stat.label}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        borderRightWidth: i < arr.length - 1 ? 1 : 0,
                        borderRightColor: GRAY_200,
                      }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '300',
                          color: GRAY_500,
                          letterSpacing: -0.32,
                        }}>
                        {stat.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '500',
                          color: '#181D27',
                          marginTop: 4,
                          letterSpacing: -0.4,
                        }}>
                        {stat.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ─────────────── PATIENT INFO ─────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: '#000', marginBottom: 12 }}>
                Patient Info
              </Text>
              <Text style={{ fontSize: 16, color: '#000', marginBottom: 12 }}>
                What have you been feeling?
              </Text>

              {/* Symptoms input */}
              <View
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: GRAY_200,
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                <TextInput
                  placeholder="Type your symptoms..."
                  placeholderTextColor={GRAY_500}
                  value={symptoms}
                  onChangeText={setSymptoms}
                  style={{ fontSize: 14, color: '#000', padding: 0 }}
                />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 13, rowGap: 8 }}>
                {FEELING_OPTIONS.map((opt) => {
                  const on = feelingIds.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleFeeling(opt.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 34,
                        borderWidth: 1,
                        backgroundColor: on ? BRAND : GRAY_100,
                        borderColor: on ? BRAND : GRAY_200,
                      }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '500', color: on ? '#FFF' : GRAY_600 }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ─────────────── SELECT DATE ─────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: '#000', marginBottom: 12 }}>
                Select Date
              </Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {weekDays.map((d) => {
                  const selected = isSameDay(d, selectedDay);
                  const today = startOfDay(new Date());
                  const isPast = d.getTime() < today.getTime();
                  const isDisabled = d.getDay() === 0 || isPast;
                  return (
                    <Pressable
                      key={d.getTime()}
                      onPress={() => {
                        if (!isDisabled) {
                          setSelectedDay(startOfDay(d));
                          setSelectedSlot(null);
                        }
                      }}
                      disabled={isDisabled}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 68,
                        borderRadius: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? BRAND : GRAY_100,
                        borderWidth: selected ? 1 : 0,
                        borderColor: selected ? BRAND : 'transparent',
                        opacity: isDisabled && !selected ? 0.4 : 1,
                        gap: 8,
                      }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '300',
                          color: selected ? 'rgba(255,255,255,0.85)' : GRAY_500,
                        }}>
                        {DAY_LABELS[d.getDay()]}
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '500',
                          color: selected ? '#FFF' : GRAY_800,
                        }}>
                        {d.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ─────────────── AVAILABLE TIME ─────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: '#000', marginBottom: 12 }}>
                Available Time
              </Text>

              {/* Period tabs */}
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 999,
                  backgroundColor: GRAY_100,
                  padding: 4,
                  marginBottom: 16,
                }}>
                {PERIOD_TABS.map((t) => {
                  const sel = period === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        setPeriod(t.id);
                        setSelectedSlot(null);
                      }}
                      style={{
                        flex: 1,
                        borderRadius: 999,
                        paddingVertical: 10,
                        alignItems: 'center',
                        backgroundColor: sel ? '#FFFFFF' : 'transparent',
                        boxShadow: sel ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                      }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: sel ? '500' : '400',
                          color: sel ? '#007AFF' : '#090909',
                        }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Time slot grid — 4 per row */}
              {!working ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: GRAY_500,
                    textAlign: 'center',
                    paddingVertical: 20,
                  }}>
                  No clinic hours on this day.
                </Text>
              ) : slotLabels.length === 0 ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: GRAY_500,
                    textAlign: 'center',
                    paddingVertical: 20,
                  }}>
                  No slots in this period.
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  {slotLabels.map((label) => {
                    const isSelected = selectedSlot === label;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setSelectedSlot(label)}
                        style={{
                          width: Math.floor((screenWidth - 40 - 3 * 16) / 4),
                          paddingVertical: 10,
                          borderRadius: 999,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: isSelected ? BRAND : GRAY_200,
                          backgroundColor: isSelected ? BRAND : GRAY_100,
                        }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: isSelected ? '#FFF' : '#000',
                          }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* ─────────────── BOOK APPOINTMENT BUTTON ─────────────── */}
          <View
            style={{
              position: 'absolute',
              bottom: Math.max(insets.bottom, 16) + 8,
              left: 16,
              right: 16,
            }}>
            <BookAppointmentButton
              onPress={handleBookAppointment}
              disabled={!selectedSlot || !symptoms.trim() || isBooking}
              isLoading={isBooking}
              trackWidth={buttonTrackWidth}
            />
          </View>
        </View>
      </HealthServiceScreenShell>
    </GestureHandlerRootView>
  );
}
