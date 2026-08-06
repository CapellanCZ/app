import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
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
} from '@/components/appointments/AppointmentCard';
import { HealthServiceScreenShell } from '@/components/health-service/HealthServiceScreenShell';
import { IconsaxCalendarSearchIcon } from '@/components/icons/IconsaxCalendarSearchIcon';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import {
  estimateEndLabel,
  formatAppointmentBookedDate,
  formatAppointmentCardDate,
  formatAppointmentCardTime,
} from '@/lib/health-service/appointmentDisplay';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { Inter } from '@/lib/typography/inter';

type AppointmentTab = 'pending' | 'confirmed' | 'cancelled';

const TAB_ORDER: AppointmentTab[] = ['pending', 'confirmed', 'cancelled'];

const TABS: { id: AppointmentTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const TAB_SWIPE_DISTANCE = 56;
const TAB_SWIPE_VELOCITY = 650;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DRAG_SPRING = { damping: 26, stiffness: 200, mass: 0.85 } as const;

/**
 * Appointments tab — Figma node 2229:500.
 */
export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('pending');
  const [panelKey, setPanelKey] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const directionRef = useRef<'forward' | 'back'>('forward');
  const reduceMotion = useReducedMotion();

  const dragX = useSharedValue(0);
  const tabIndexSV = useSharedValue(0);
  const reduceMotionSV = useSharedValue(false);

  const appointments = useHealthServiceStore((s) => s.appointments);
  const staff = useHealthServiceStore((s) => s.staff);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const loadStaff = useHealthServiceStore((s) => s.loadStaff);
  const cancelAppointment = useHealthServiceStore((s) => s.cancelAppointment);
  const refreshData = useHealthServiceStore((s) => s.refreshData);

  useEffect(() => {
    tabIndexSV.value = TAB_ORDER.indexOf(activeTab);
  }, [activeTab, tabIndexSV]);

  useEffect(() => {
    reduceMotionSV.value = Boolean(reduceMotion);
  }, [reduceMotion, reduceMotionSV]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      if (!staff.length) loadStaff();
    }, [loadAppointments, loadStaff, staff.length]),
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
    const list = appointments.filter((a) => a.status === activeTab);

    return list.sort((a, b) => {
      if (a.dateKey !== b.dateKey) {
        return activeTab === 'cancelled'
          ? b.dateKey.localeCompare(a.dateKey)
          : a.dateKey.localeCompare(b.dateKey);
      }
      return a.startLabel.localeCompare(b.startLabel);
    });
  }, [appointments, activeTab]);

  const emptyCopy =
    activeTab === 'pending'
      ? {
          title: 'No Pending Appointments',
          body: "You don't have any pending appointments right now.",
        }
      : activeTab === 'confirmed'
        ? {
            title: 'No Confirmed Appointments',
            body: 'Your confirmed appointments will appear here.',
          }
        : {
            title: 'No Cancelled Appointments',
            body: 'Cancelled appointments will show up here.',
          };

  const requestCancel = (id: string, doctorName: string) => {
    Alert.alert(
      'Cancel appointment?',
      `Cancel your appointment with ${doctorName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setCancellingId(id);
              try {
                await cancelAppointment(id);
              } catch {
                Alert.alert('Could not cancel', 'Please try again in a moment.');
              } finally {
                setCancellingId(null);
              }
            })();
          },
        },
      ],
    );
  };

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

              {/* Pending / Confirmed / Cancelled — black selected pill */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                }}>
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
                        height: 36,
                        borderRadius: 99,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 10,
                        backgroundColor: selected ? '#000000' : 'rgba(255,255,255,0.32)',
                        borderWidth: selected ? 0 : 1,
                        borderColor: '#E3E3E3',
                      }}>
                      <Text
                        style={{
                          fontFamily: Inter.regular,
                          fontSize: 17,
                          color: selected ? '#FFFFFF' : '#666666',
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
              {filtered.length === 0 ? (
                <View
                  style={{
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 28,
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    minHeight: 220,
                  }}>
                  <IconsaxCalendarSearchIcon size={48} color="#A4A7AE" />
                  <View style={{ gap: 4, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 18,
                        color: '#717680',
                        letterSpacing: -0.32,
                        textAlign: 'center',
                      }}>
                      {emptyCopy.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 14,
                        color: '#A4A7AE',
                        letterSpacing: -0.24,
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
                  const canCancel = item.status === 'pending' || item.status === 'confirmed';
                  const isConfirmed = item.status === 'confirmed';
                  const timeLabel = isConfirmed
                    ? (() => {
                        const est =
                          item.endLabel?.trim() ||
                          estimateEndLabel(item.startLabel) ||
                          null;
                        return est
                          ? `${item.startLabel} · EST ${est}`
                          : formatAppointmentCardTime(item.startLabel);
                      })()
                    : formatAppointmentCardTime(item.startLabel);

                  return (
                    <AppointmentCard
                      key={item.id}
                      enterIndex={index}
                      staffName={doctorName}
                      staffSpecialty={staffMember?.specialtyLabel ?? 'Physician'}
                      staffPhoto={staffMember?.photoUrl}
                      dateLabel={formatAppointmentCardDate(item.dateKey)}
                      timeLabel={timeLabel}
                      backgroundColor={
                        APPOINTMENT_CARD_COLORS[index % APPOINTMENT_CARD_COLORS.length]
                      }
                      showCancel={canCancel}
                      cancelDisabled={cancellingId === item.id}
                      onCancel={() => requestCancel(item.id, doctorName)}
                      onPress={
                        item.status === 'cancelled'
                          ? undefined
                          : () =>
                              router.push({
                                pathname: '/health-service/appointment-booked',
                                params: {
                                  id: item.id,
                                  doctorName,
                                  specialtyLabel: staffMember?.specialtyLabel ?? 'Physician',
                                  photoUrl: staffMember?.photoUrl ?? '',
                                  appointmentDate: formatAppointmentBookedDate(item.dateKey),
                                  appointmentTime: item.startLabel,
                                  dateKey: item.dateKey,
                                  status: item.status,
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
