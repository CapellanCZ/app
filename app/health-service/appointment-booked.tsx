import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
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
import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { useAuth } from '@/lib/auth/AuthProvider';

import { IconsaxVerifyIcon } from '@/components/icons/IconsaxVerifyIcon';
import { IconsaxProfileIcon } from '@/components/icons/IconsaxProfileIcon';
import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { StatusIcon } from '@/components/icons/StatusIcon';

const GRAY_50 = '#FAFAFA';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E9EAEB';
const GRAY_500 = '#717680';
const GRAY_800 = '#252B37';
const GRAY_900 = '#181D27';
const BRAND_BLUE = '#2970FF';
const WARNING_THRESHOLD_MS = 10 * 60 * 1000;

// Deterministic barcode pattern derived from check-in code
function generateBarPattern(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const bars: number[] = [];
  let h = hash;
  for (let i = 0; i < 36; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    bars.push((h % 3) + 1); // 1, 2, or 3
  }
  return bars;
}

function Barcode({ code }: { code: string }) {
  const bars = generateBarPattern(code);
  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={{
              width: h === 3 ? 6 : h === 2 ? 4 : 2,
              height: h === 1 ? 52 : h === 2 ? 68 : 80,
              backgroundColor: '#000',
              borderRadius: 1,
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 12, color: '#000', marginTop: 10, letterSpacing: 3, fontWeight: '500' }}>
        {code}
      </Text>
    </View>
  );
}

const KNOB_SIZE = 48;
const TRACK_PADDING = 4;

function SlideToCancelButton({ onSlide, trackWidth }: { onSlide: () => void; trackWidth: number }) {
  const maxDrag = trackWidth - KNOB_SIZE - TRACK_PADDING * 2;
  const translateX = useSharedValue(0);
  const chevronOpacity = useSharedValue(1);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    chevronOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  useAnimatedReaction(
    () => translateX.value,
    (current) => {
      if (current === 0) {
        chevronOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          false
        );
      } else {
        chevronOpacity.value = withTiming(0.5, { duration: 200 });
      }
    }
  );

  const handleComplete = () => {
    setIsSliding(true);
    onSlide();
    setTimeout(() => {
      translateX.value = withTiming(0, { duration: 300 });
      setIsSliding(false);
    }, 400);
  };

  const panGesture = Gesture.Pan()
    .enabled(!isSliding)
    .onUpdate((e) => {
      translateX.value = Math.max(0, Math.min(e.translationX, maxDrag));
    })
    .onEnd(() => {
      if (translateX.value >= maxDrag * 0.7) {
        translateX.value = withSpring(maxDrag, { damping: 15, stiffness: 150 });
        runOnJS(handleComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, maxDrag * 0.3], [1, 0], Extrapolate.CLAMP),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    opacity:
      chevronOpacity.value *
      interpolate(translateX.value, [maxDrag * 0.5, maxDrag], [1, 0], Extrapolate.CLAMP),
  }));

  return (
    <View
      style={{
        height: 56,
        backgroundColor: GRAY_900,
        borderRadius: 28,
        overflow: 'hidden',
        justifyContent: 'center',
        position: 'relative',
      }}>
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: KNOB_SIZE + TRACK_PADDING + 16,
            paddingRight: 24,
          },
          labelStyle,
        ]}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
          Slide to Cancel Appointment
        </Text>
        <Animated.Text
          style={[
            { fontSize: 18, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
            chevronStyle,
          ]}>
          {`>>>`}
        </Animated.Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: TRACK_PADDING,
              width: KNOB_SIZE,
              height: KNOB_SIZE,
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
          <IconsaxArrowRightIcon size={24} color={GRAY_900} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function AppointmentBookedScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { toast } = useToast();
  const { session } = useAuth();
  const { id: appointmentId, doctorName, appointmentDate, appointmentTime, checkInCode, expiresAt } =
    useLocalSearchParams<{
      id?: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      checkInCode: string;
      expiresAt?: string;
    }>();

  const trackWidth = screenWidth - 32;
  const [now, setNow] = useState(Date.now());
  const expiryMs = useRef(expiresAt ? Date.parse(expiresAt) : Date.now() + 60 * 60 * 1000).current;
  const warningSentRef = useRef(false);
  const expiredSentRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, expiryMs - now);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const isExpired = remaining === 0;
  const isExpiringSoon = remaining > 0 && remaining <= WARNING_THRESHOLD_MS;
  const remainingMinutes = Math.max(1, Math.ceil(remaining / 60000));

  useEffect(() => {
    if (isExpiringSoon && !warningSentRef.current) {
      warningSentRef.current = true;
      useNotificationStore.getState().notifySelf(session?.user?.id, {
        category: 'health',
        title: 'Ticket expiring soon',
        body: `Your check-in ticket expires in ${remainingMinutes} minutes. Please check in or cancel your appointment to keep your slot.`,
        href: '/health-service/appointments',
        notificationType: 'warning',
      });
      toast.show({
        variant: 'info',
        placement: 'top',
        duration: 5000,
        label: 'Ticket expiring soon',
        description: `You have ${remainingMinutes} minutes left to check in.`,
      });
    }
  }, [isExpiringSoon, remainingMinutes, session?.user?.id, toast]);

  useEffect(() => {
    if (isExpired && !expiredSentRef.current) {
      expiredSentRef.current = true;
      useNotificationStore.getState().notifySelf(session?.user?.id, {
        category: 'health',
        title: 'Ticket expired',
        body: `Your check-in ticket has expired. Book a new appointment if you still need assistance.`,
        href: '/health-service/appointments',
        notificationType: 'error',
      });
      toast.show({
        variant: 'danger',
        placement: 'top',
        duration: 6000,
        label: 'Ticket expired',
        description: 'Your check-in ticket has expired. Please book again.',
      });
    }
  }, [isExpired, session?.user?.id, toast]);

  const handleCancel = async () => {
    try {
      if (appointmentId) {
        await healthServiceApi.cancelAppointment(String(appointmentId));
        useHealthServiceStore.getState().loadAppointments();
        useNotificationStore.getState().notifySelf(session?.user?.id, {
          category: 'health',
          title: 'Appointment Cancelled',
          body: `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been cancelled.`,
          href: '/health-service/appointments',
          notificationType: 'info',
        });
        toast.show({
          variant: 'danger',
          placement: 'top',
          duration: 4000,
          label: 'Appointment Cancelled',
          description: `Your appointment with ${doctorName} has been cancelled.`,
        });
      }
    } finally {
      router.back();
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
        {/* X close button */}
        <Pressable
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            top: Math.max(insets.top, 16) + 4,
            left: 20,
            zIndex: 10,
            padding: 4,
          }}>
          <Ionicons name="close" size={28} color={GRAY_800} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: Math.max(insets.top, 16) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 88,
            paddingHorizontal: 16,
          }}>

          {/* ── Success icon + title ── */}
          <View style={{ alignItems: 'center', gap: 16, marginTop: 40 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 999,
                backgroundColor: GRAY_100,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <IconsaxVerifyIcon size={66} color="#34D399" />
            </View>

            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '500',
                  color: GRAY_800,
                  letterSpacing: -1.12,
                  textAlign: 'center',
                }}>
                Appointment Booked
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: GRAY_500,
                  textAlign: 'center',
                  lineHeight: 22,
                  letterSpacing: -0.32,
                }}>
                {'Your appointment has been confirmed. Details\nhave been sent to your email.'}
              </Text>
            </View>
          </View>

          {/* ── Details card ── */}
          <View
            style={{
              marginTop: 32,
              backgroundColor: GRAY_50,
              borderRadius: 32,
              padding: 16,
              gap: 16,
            }}>
            {/* Info rows */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: GRAY_200,
                padding: 20,
                gap: 0,
              }}>
              {/* Doctor */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 17 }}>
                <IconsaxProfileIcon size={28} color={GRAY_800} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: GRAY_500, letterSpacing: -0.28 }}>
                    Doctor
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: GRAY_900, marginTop: 2 }}>
                    {doctorName ?? 'Doctor'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: GRAY_200, marginVertical: 16 }} />

              {/* Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 17 }}>
                <IconsaxCalendarIcon size={28} color={GRAY_800} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: GRAY_500, letterSpacing: -0.28 }}>
                    Appointment Date
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: GRAY_900, marginTop: 2 }}>
                    {appointmentDate ?? '—'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: GRAY_200, marginVertical: 16 }} />

              {/* Time */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                <IconsaxClockIcon size={28} color={GRAY_800} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: GRAY_500, letterSpacing: -0.28 }}>
                    Appointment Time
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: GRAY_900, marginTop: 2 }}>
                    {appointmentTime ?? '—'}
                  </Text>
                  <Text style={{ fontSize: 12, color: GRAY_500, marginTop: 4 }}>
                    Please be 10 minutes early in your appointment
                  </Text>
                </View>
              </View>
            </View>

            {/* Barcode */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
              }}>
              {(isExpiringSoon || isExpired) && (
                <View
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#F5F5F5',
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 14,
                    marginBottom: 12,
                  }}>
                  <StatusIcon variant={isExpired ? 'error' : 'warning'} size={40} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: GRAY_900, letterSpacing: -0.28 }}>
                      {isExpired ? 'Ticket expired' : 'Ticket expiring soon'}
                    </Text>
                    <Text style={{ fontSize: 12, color: GRAY_500, lineHeight: 18 }}>
                      {isExpired ? (
                        'Your check-in ticket has expired. Book a new appointment if you still need assistance.'
                      ) : (
                        <>
                          {'Your ticket will be canceled in '}
                          <Text style={{ color: BRAND_BLUE, fontWeight: '600' }}>
                            {remainingMinutes} minutes
                          </Text>
                          {' if you do not check in.'}
                        </>
                      )}
                    </Text>
                  </View>
                </View>
              )}
              <Barcode code={checkInCode ?? 'CH-001'} />
              <Text style={{ marginTop: 6, fontSize: 12, color: GRAY_500 }}>
                {isExpired ? 'Expired' : `Expires in ${pad(h)}:${pad(m)}:${pad(s)}`}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* ── Sticky slide-to-cancel button ── */}
        <View
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom, 16) + 8,
            left: 16,
            right: 16,
          }}>
          <SlideToCancelButton onSlide={handleCancel} trackWidth={trackWidth} />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
