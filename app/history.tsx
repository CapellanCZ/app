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
  MEDICAL_RECORD_CARD_COLORS,
  MedicalRecordCard,
} from '@/components/history/MedicalRecordCard';
import { MedicalRecordListSkeleton } from '@/components/history/MedicalRecordCardSkeleton';
import { IconsaxDocumentTextIcon } from '@/components/icons/IconsaxDocumentTextIcon';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import {
  formatAppointmentBookedDate,
  formatAppointmentCardDate,
} from '@/lib/health-service/appointmentDisplay';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { StaffRole } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';

type RoleTab = 'physician' | 'dentist';

const TAB_ORDER: RoleTab[] = ['physician', 'dentist'];

const TABS: { id: RoleTab; label: string; roles: StaffRole[] }[] = [
  { id: 'physician', label: 'Physician', roles: ['doctor', 'nurse'] },
  { id: 'dentist', label: 'Dentist', roles: ['dentist'] },
];

const TAB_SWIPE_DISTANCE = 56;
const TAB_SWIPE_VELOCITY = 650;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DRAG_SPRING = { damping: 26, stiffness: 200, mass: 0.85 } as const;

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Medical Records tab — Figma node 2229:946.
 */
export default function HistoryTab() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<RoleTab>('physician');
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
      console.error('Medical records refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const goToTab = useCallback((next: RoleTab, direction: 'forward' | 'back') => {
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

  const visits = useMemo(() => {
    const today = todayDateKey();
    const roleSet = new Set(TABS.find((t) => t.id === activeTab)?.roles ?? []);

    return appointments
      .filter((a) => {
        if (a.status === 'cancelled') return false;
        if (a.status === 'completed') {
          // keep
        } else if (a.status === 'confirmed' && a.dateKey < today) {
          // past confirmed counts as visited
        } else {
          return false;
        }

        const member = staff.find((s) => s.id === a.staffId);
        if (!member) return activeTab === 'physician';
        return roleSet.has(member.role);
      })
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey);
        return b.startLabel.localeCompare(a.startLabel);
      });
  }, [appointments, staff, activeTab]);

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

  // Skeleton only until the first appointments fetch. Revisiting uses cache.
  const showSkeleton = !refreshing && !appointmentsLoaded && appointments.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9', paddingTop: insets.top }}>
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
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
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
                  Medical Records
                </Text>
                <Text
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 18,
                    color: '#727272',
                    letterSpacing: -0.64,
                    lineHeight: 20,
                  }}>
                  Review your past clinic visits here
                </Text>
              </View>

              {/* Physician / Dentist pills — Figma 2229:953 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' }}>
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
              {showSkeleton ? (
                <MedicalRecordListSkeleton count={4} />
              ) : visits.length === 0 ? (
                <View
                  style={{
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 40,
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    minHeight: 220,
                  }}>
                  <IconsaxDocumentTextIcon size={48} color="#A4A7AE" />
                  <View style={{ gap: 4, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 18,
                        color: '#717680',
                        letterSpacing: -0.32,
                        textAlign: 'center',
                      }}>
                      No Visit History Yet
                    </Text>
                    <Text
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 14,
                        color: '#A4A7AE',
                        letterSpacing: -0.24,
                        textAlign: 'center',
                      }}>
                      {activeTab === 'physician'
                        ? 'Past physician visits will appear here.'
                        : 'Past dentist visits will appear here.'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Book a clinic visit"
                    onPress={() => router.replace('/(tabs)')}
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 100,
                      backgroundColor: '#000000',
                    }}>
                    <Text
                      style={{
                        fontFamily: Inter.semiBold,
                        fontSize: 16,
                        color: '#FFFFFF',
                      }}>
                      Book a visit
                    </Text>
                  </Pressable>
                </View>
              ) : (
                visits.map((item, index) => {
                  const staffMember = staff.find((s) => s.id === item.staffId);
                  const doctorName = staffMember?.name ?? 'Clinic staff';
                  const reason = item.reason?.trim() || 'Clinic visit';

                  return (
                    <MedicalRecordCard
                      key={`${panelKey}-${item.id}`}
                      enterIndex={index}
                      staffName={doctorName}
                      staffSpecialty={staffMember?.specialtyLabel ?? 'Physician'}
                      staffPhoto={staffMember?.photoUrl}
                      dateLabel={formatAppointmentCardDate(item.dateKey)}
                      reasonLabel={reason}
                      backgroundColor={
                        MEDICAL_RECORD_CARD_COLORS[index % MEDICAL_RECORD_CARD_COLORS.length]
                      }
                      onPress={() =>
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
  );
}
