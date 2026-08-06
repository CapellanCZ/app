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

import { DoctorListCard } from '@/components/health-service/DoctorListCard';
import { DoctorListSkeleton } from '@/components/health-service/DoctorListCardSkeleton';
import { HealthServiceScreenShell } from '@/components/health-service/HealthServiceScreenShell';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { healthServiceApi, type StaffPresenceStatus } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { StaffRole } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';

type FilterId = 'all' | 'doctor' | 'dentist';

const FILTER_ORDER: FilterId[] = ['all', 'doctor', 'dentist'];

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'doctor', label: 'Physician' },
  { id: 'dentist', label: 'Dentist' },
];

const TAB_SWIPE_DISTANCE = 56;
const TAB_SWIPE_VELOCITY = 650;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DRAG_SPRING = { damping: 26, stiffness: 200, mass: 0.85 } as const;

/** Survive remounts so revisiting doesn't flash "unavailable" while presence refetches. */
let cachedStaffPresence: Record<string, StaffPresenceStatus> = {};

/**
 * School Doctors — Figma node 2243:333.
 */
export default function AllDoctorsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterId>('all');
  const [panelKey, setPanelKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [presence, setPresence] = useState<Record<string, StaffPresenceStatus>>(
    () => cachedStaffPresence,
  );
  const directionRef = useRef<'forward' | 'back'>('forward');
  const reduceMotion = useReducedMotion();

  const dragX = useSharedValue(0);
  const tabIndexSV = useSharedValue(0);
  const reduceMotionSV = useSharedValue(false);

  const { staff, loadStaff } = useHealthServiceStore();
  const staffLoaded = useHealthServiceStore((s) => s.staffLoaded);

  useEffect(() => {
    tabIndexSV.value = FILTER_ORDER.indexOf(filter);
  }, [filter, tabIndexSV]);

  useEffect(() => {
    reduceMotionSV.value = Boolean(reduceMotion);
  }, [reduceMotion, reduceMotionSV]);

  const doctors = useMemo(
    () => staff.filter((s) => s.role === 'doctor' || s.role === 'dentist'),
    [staff],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return doctors;
    return doctors.filter((s) => s.role === (filter as StaffRole));
  }, [doctors, filter]);

  const loadAvailability = useCallback(async () => {
    if (!doctors.length) {
      cachedStaffPresence = {};
      setPresence({});
      return;
    }
    const today = new Date();
    const entries = await Promise.all(
      doctors.map(async (s) => {
        try {
          const status = await healthServiceApi.getStaffPresence(s.id, today);
          return [s.id, status] as const;
        } catch {
          return [s.id, 'unavailable' as StaffPresenceStatus] as const;
        }
      }),
    );
    const next = Object.fromEntries(entries);
    cachedStaffPresence = next;
    setPresence(next);
  }, [doctors]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          if (!useHealthServiceStore.getState().staffLoaded) {
            await loadStaff();
          }
          if (cancelled) return;

          const list = useHealthServiceStore
            .getState()
            .staff.filter((s) => s.role === 'doctor' || s.role === 'dentist');
          if (!list.length) {
            cachedStaffPresence = {};
            setPresence({});
            return;
          }

          const today = new Date();
          const entries = await Promise.all(
            list.map(async (s) => {
              try {
                const status = await healthServiceApi.getStaffPresence(s.id, today);
                return [s.id, status] as const;
              } catch {
                return [s.id, 'unavailable' as StaffPresenceStatus] as const;
              }
            }),
          );
          if (!cancelled) {
            const next = Object.fromEntries(entries);
            cachedStaffPresence = next;
            setPresence(next);
          }
        } catch (e) {
          console.error('School doctors load failed:', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [loadStaff]),
  );

  const goToFilter = useCallback((next: FilterId, direction: 'forward' | 'back') => {
    setFilter((prev) => {
      if (prev === next) return prev;
      directionRef.current = direction;
      setPanelKey((k) => k + 1);
      return next;
    });
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(FILTER_ORDER.length - 1, index));
      const next = FILTER_ORDER[clamped];
      const current = FILTER_ORDER.indexOf(filter);
      if (clamped === current) return;
      goToFilter(next, clamped > current ? 'forward' : 'back');
    },
    [filter, goToFilter],
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

          if (shouldNext && current < FILTER_ORDER.length - 1) {
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStaff();
      await loadAvailability();
    } catch (e) {
      console.error('School doctors refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [loadAvailability, loadStaff]);

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

  // Skeleton only until the first staff fetch finishes. Revisiting uses cache.
  const showSkeleton = !refreshing && !staffLoaded && doctors.length === 0;

  return (
    <HealthServiceScreenShell>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ flex: 1, overflow: 'visible' }, dragStyle]}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical
              keyboardDismissMode="on-drag"
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
                paddingBottom: 40,
                gap: 20,
                backgroundColor: '#F9F9F9',
              }}>
              {/* Header */}
              <View style={{ gap: 16 }}>
                <CircleBackButton onPress={() => router.back()} />

                <View>
                  <Text
                    style={{
                      fontFamily: Inter.medium,
                      fontSize: 28,
                      color: '#222222',
                      letterSpacing: -2.24,
                      lineHeight: 38,
                    }}>
                    School Doctors
                  </Text>
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 16,
                      color: '#727272',
                      letterSpacing: -0.64,
                      lineHeight: 20,
                    }}>
                    Choose a doctor that you want to be accomadated
                  </Text>
                </View>

                {/* All · Physician · Dentist */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {FILTERS.map((chip) => {
                    const selected = filter === chip.id;
                    return (
                      <Pressable
                        key={chip.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          const nextIndex = FILTER_ORDER.indexOf(chip.id);
                          const current = FILTER_ORDER.indexOf(filter);
                          if (nextIndex === current) return;
                          goToFilter(chip.id, nextIndex > current ? 'forward' : 'back');
                        }}
                        style={{
                          flex: 1,
                          height: 36,
                          borderRadius: 99,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? '#000000' : 'rgba(255,255,255,0.32)',
                          borderWidth: selected ? 0 : 1,
                          borderColor: '#E3E3E3',
                        }}
                        className="active:opacity-80">
                        <Text
                          style={{
                            fontFamily: Inter.regular,
                            fontSize: 15,
                            color: selected ? '#FFFFFF' : '#666666',
                            letterSpacing: -1.2,
                            textAlign: 'center',
                          }}>
                          {chip.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Doctor list */}
              <Animated.View
                key={panelKey}
                entering={entering}
                exiting={exiting}
                style={{ gap: 12, width: '100%', flexGrow: 1 }}>
                {!showSkeleton && filtered.length === 0 ? (
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 14,
                      color: '#9095A1',
                      textAlign: 'center',
                      paddingVertical: 32,
                    }}>
                    No doctors in this category yet.
                  </Text>
                ) : showSkeleton ? (
                  <DoctorListSkeleton count={4} />
                ) : (
                  filtered.map((s, index) => (
                    <DoctorListCard
                      key={`${panelKey}-${s.id}`}
                      enterIndex={index}
                      staff={s}
                      status={presence[s.id] ?? 'unavailable'}
                      onPress={() => router.push(`/health-service/book/${s.id}`)}
                    />
                  ))
                )}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </HealthServiceScreenShell>
  );
}
