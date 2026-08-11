import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  APPOINTMENT_CARD_COLORS,
  AppointmentCard,
  type AppointmentCardVariant,
} from '@/components/appointments/AppointmentCard';
import { AppointmentListSkeleton } from '@/components/appointments/AppointmentCardSkeleton';
import { EmptyStateAppointmentsIllustration } from '@/components/appointments/EmptyStateAppointmentsIllustration';
import { HealthServiceScreenShell } from '@/components/health-service/HealthServiceScreenShell';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import {
  formatAppointmentBookedDate,
  formatAppointmentCancelledWhen,
  formatAppointmentCardDateTime,
  formatCancellationLabel,
} from '@/lib/health-service/appointmentDisplay';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { Inter } from '@/lib/typography/inter';

/** Figma tabs: Upcoming · Past · Cancelled */
type AppointmentTab = 'upcoming' | 'past' | 'cancelled';

const TAB_ORDER: AppointmentTab[] = ['upcoming', 'past', 'cancelled'];

const TABS: { id: AppointmentTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

const TAB_SWIPE_DISTANCE = 56;
const TAB_SWIPE_VELOCITY = 650;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DRAG_SPRING = { damping: 26, stiffness: 200, mass: 0.85 } as const;

function matchesTab(
  status: string,
  tab: AppointmentTab,
): boolean {
  if (tab === 'upcoming') return status === 'pending' || status === 'confirmed';
  if (tab === 'past') return status === 'completed';
  return status === 'cancelled';
}

/**
 * Appointments — Figma 2229:500 (Upcoming), 2275:1277 (Past), 2279:1555 (Cancelled).
 */
export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming');
  const [panelKey, setPanelKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const directionRef = useRef<'forward' | 'back'>('forward');
  const reduceMotion = useReducedMotion();

  const dragX = useSharedValue(0);
  const tabIndexSV = useSharedValue(0);
  const reduceMotionSV = useSharedValue(false);

  const appointments = useHealthServiceStore((s) => s.appointments);
  const appointmentsLoaded = useHealthServiceStore((s) => s.appointmentsLoaded);
  const staff = useHealthServiceStore((s) => s.staff);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const loadStaff = useHealthServiceStore((s) => s.loadStaff);
  const refreshData = useHealthServiceStore((s) => s.refreshData);

  useEffect(() => {
    tabIndexSV.value = TAB_ORDER.indexOf(activeTab);
  }, [activeTab, tabIndexSV]);

  useEffect(() => {
    reduceMotionSV.value = Boolean(reduceMotion);
  }, [reduceMotion, reduceMotionSV]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
      if (!useHealthServiceStore.getState().staffLoaded) {
        void loadStaff();
      }
    }, [loadAppointments, loadStaff]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (e) {
      console.error('Appointments refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const goToTab = useCallback((next: AppointmentTab, direction: 'forward' | 'back') => {
    setActiveTab((prev) => {
      if (prev === next) return prev;
      directionRef.current = direction;
      setPanelKey((k) => k + 1);
      return next;
    });
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(TAB_ORDER.length - 1, index));
      const next = TAB_ORDER[clamped];
      const current = TAB_ORDER.indexOf(activeTab);
      if (clamped === current) return;
      goToTab(next, clamped > current ? 'forward' : 'back');
    },
    [activeTab, goToTab],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          if (reduceMotionSV.value) return;
          dragX.value = e.translationX * 0.35;
        })
        .onEnd((e) => {
          const current = tabIndexSV.value;
          const shouldNext =
            e.translationX < -TAB_SWIPE_DISTANCE || e.velocityX < -TAB_SWIPE_VELOCITY;
          const shouldPrev =
            e.translationX > TAB_SWIPE_DISTANCE || e.velocityX > TAB_SWIPE_VELOCITY;

          if (shouldNext && current < TAB_ORDER.length - 1) {
            runOnJS(goToIndex)(current + 1);
          } else if (shouldPrev && current > 0) {
            runOnJS(goToIndex)(current - 1);
          }
          dragX.value = withSpring(0, DRAG_SPRING);
        }),
    [dragX, goToIndex, reduceMotionSV, tabIndexSV],
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  const filtered = useMemo(() => {
    const list = appointments.filter((a) => matchesTab(a.status, activeTab));
    const newestFirst = activeTab !== 'upcoming';

    return list.sort((a, b) => {
      if (a.dateKey !== b.dateKey) {
        return newestFirst
          ? b.dateKey.localeCompare(a.dateKey)
          : a.dateKey.localeCompare(b.dateKey);
      }
      return newestFirst
        ? b.startLabel.localeCompare(a.startLabel)
        : a.startLabel.localeCompare(b.startLabel);
    });
  }, [appointments, activeTab]);

  /** Figma 2286:427 — same layout/type as notifications empty state. */
  const emptyCopy =
    activeTab === 'upcoming'
      ? {
          title: 'No appointments yet',
          body: "You don't have any upcoming appointments\nright now",
        }
      : activeTab === 'past'
        ? {
            title: 'No past appointments',
            body: "You haven't completed any visits yet",
          }
        : {
            title: 'No cancelled appointments',
            body: "You haven't cancelled any appointments",
          };

  const showSkeleton = !refreshing && !appointmentsLoaded && appointments.length === 0;

  const entering = reduceMotion
    ? FadeIn.duration(120)
    : directionRef.current === 'forward'
      ? FadeInRight.duration(180).easing(EASE_OUT)
      : FadeInLeft.duration(180).easing(EASE_OUT);

  const exiting = reduceMotion
    ? FadeOut.duration(120)
    : directionRef.current === 'forward'
      ? FadeOutLeft.duration(140).easing(EASE_OUT)
      : FadeOutRight.duration(140).easing(EASE_OUT);

  return (
    <HealthServiceScreenShell>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ flex: 1, overflow: 'visible' }, dragStyle]}>
            <ScrollView
              style={{ flex: 1 }}
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#111111"
                  colors={['#111111']}
                  progressBackgroundColor="#FFFFFF"
                  progressViewOffset={8}
                />
              }
              contentContainerStyle={{
                flexGrow: 1,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 8,
                paddingHorizontal: 20,
                gap: 20,
              }}>
              <View style={{ gap: 16 }}>
                <CircleBackButton onPress={() => router.back()} />
                <View>
                  <Text
                    style={{
                      fontFamily: Inter.medium,
                      fontSize: 30,
                      color: '#222222',
                      letterSpacing: -2.24,
                      lineHeight: 38,
                    }}>
                    Appointments
                  </Text>
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 18,
                      color: '#727272',
                      letterSpacing: -0.64,
                      lineHeight: 20,
                    }}>
                    Track the status of your appointments here
                  </Text>
                </View>

                {/* Upcoming / Past / Cancelled — full-width underline tabs */}
                <View style={{ flexDirection: 'row', width: '100%' }}>
                  {TABS.map((tab) => {
                    const selected = activeTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          const nextIndex = TAB_ORDER.indexOf(tab.id);
                          const current = TAB_ORDER.indexOf(activeTab);
                          if (nextIndex === current) return;
                          goToTab(tab.id, nextIndex > current ? 'forward' : 'back');
                        }}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 8,
                          borderBottomWidth: selected ? 1.5 : 1,
                          borderBottomColor: selected ? '#323232' : '#E3E3E3',
                        }}>
                        <Text
                          style={{
                            fontFamily: selected ? Inter.semiBold : Inter.regular,
                            fontSize: 15,
                            color: selected ? '#3C3A3A' : '#9E9E9E',
                            letterSpacing: -1.2,
                            textAlign: 'center',
                          }}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Animated.View
                key={panelKey}
                entering={entering}
                exiting={exiting}
                style={{ gap: 12, width: '100%', flexGrow: 1 }}>
                {showSkeleton ? (
                  <AppointmentListSkeleton count={3} />
                ) : filtered.length === 0 ? (
                  <View
                    style={{
                      flexGrow: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingBottom: 48,
                      minHeight: 320,
                    }}>
                    <View style={{ alignItems: 'center', gap: 12, maxWidth: 320 }}>
                      <EmptyStateAppointmentsIllustration size={192} />
                      <Text
                        style={{
                          fontFamily: Inter.medium,
                          fontSize: 28,
                          letterSpacing: -2.24,
                          lineHeight: 38,
                          color: '#222222',
                          textAlign: 'center',
                        }}>
                        {emptyCopy.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: Inter.regular,
                          fontSize: 16,
                          letterSpacing: -0.64,
                          lineHeight: 20,
                          color: '#727272',
                          textAlign: 'center',
                        }}>
                        {emptyCopy.body}
                      </Text>
                    </View>
                  </View>
                ) : (
                  filtered.map((item, index) => {
                    const staffMember = staff.find((s) => s.id === item.staffId);
                    const doctorName = staffMember?.name ?? 'Unknown Doctor';
                    const variant = activeTab as AppointmentCardVariant;

                    const dateLabel =
                      variant === 'upcoming' || variant === 'past'
                        ? formatAppointmentCardDateTime(item.dateKey, item.startLabel)
                        : formatAppointmentCancelledWhen(item.dateKey, item.startLabel);

                    const secondaryLabel =
                      variant === 'upcoming'
                        ? undefined
                        : variant === 'cancelled'
                          ? formatCancellationLabel(item.cancellationReason)
                          : formatVisitReasonDisplay(item.reason) || 'Consultation';

                    return (
                      <AppointmentCard
                        key={`${panelKey}-${item.id}`}
                        variant={variant}
                        status={
                          item.status === 'pending' || item.status === 'confirmed'
                            ? item.status
                            : undefined
                        }
                        enterIndex={index}
                        staffName={doctorName}
                        staffSpecialty={staffMember?.specialtyLabel ?? 'Physician'}
                        staffPhoto={staffMember?.photoUrl}
                        dateLabel={dateLabel}
                        secondaryLabel={secondaryLabel}
                        backgroundColor={
                          APPOINTMENT_CARD_COLORS[index % APPOINTMENT_CARD_COLORS.length]
                        }
                        onReschedule={
                          variant === 'cancelled'
                            ? () =>
                                router.push({
                                  pathname: '/health-service/book/[staffId]',
                                  params: { staffId: item.staffId },
                                })
                            : undefined
                        }
                        onPress={
                          variant === 'cancelled'
                            ? undefined
                            : variant === 'past'
                              ? () =>
                                  router.push({
                                    pathname: '/visit-completed',
                                    params: {
                                      id: item.id,
                                      staffId: item.staffId,
                                      doctorName,
                                      specialtyLabel:
                                        staffMember?.specialtyLabel ?? 'Physician',
                                      photoUrl: staffMember?.photoUrl ?? '',
                                      appointmentDate: formatAppointmentBookedDate(item.dateKey),
                                      appointmentTime: item.startLabel,
                                      dateKey: item.dateKey,
                                      reason: item.reason ?? '',
                                      completedTime: item.endLabel ?? '',
                                    },
                                  })
                              : () =>
                                  router.push({
                                    pathname: '/health-service/appointment-booked',
                                    params: {
                                      id: item.id,
                                      doctorName,
                                      specialtyLabel:
                                        staffMember?.specialtyLabel ?? 'Physician',
                                      photoUrl: staffMember?.photoUrl ?? '',
                                      appointmentDate: formatAppointmentBookedDate(item.dateKey),
                                      appointmentTime: item.startLabel,
                                      dateKey: item.dateKey,
                                      status: item.status,
                                      reason: item.reason ?? '',
                                    },
                                  })
                        }
                      />
                    );
                  })
                )}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </HealthServiceScreenShell>
  );
}
