import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
  AppointmentCard,
  type AppointmentCardDetailRow,
  type AppointmentCardVariant,
} from '@/components/appointments/AppointmentCard';
import { AppointmentListSkeleton } from '@/components/appointments/AppointmentCardSkeleton';
import { AppointmentsPrivacyBanner } from '@/components/appointments/AppointmentsPrivacyBanner';
import { AppointmentsSearchBar } from '@/components/appointments/AppointmentsSearchBar';
import { AppointmentsStatusSegment, type AppointmentsTabId } from '@/components/appointments/AppointmentsStatusSegment';
import { matchesStatusFilter } from '@/components/appointments/appointmentsFilterUtils';
import { EmptyStateAppointmentsIllustration } from '@/components/appointments/EmptyStateAppointmentsIllustration';
import { formatVisitReasonDisplay } from '@/components/booking/BookingConsultationFields';
import { HealthServiceScreenShell } from '@/components/health-service/HealthServiceScreenShell';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { useConsultationSummaryStore } from '@/lib/consultation/consultationSummaryStore';
import { useAppointmentStatusStore } from '@/lib/health-service/appointmentStatusStore';
import {
  formatAppointmentBookedDate,
  formatAppointmentCardDateTime,
} from '@/lib/health-service/appointmentDisplay';
import { resolveAppointmentStaffDisplay } from '@/lib/health-service/appointmentStaff';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { Inter } from '@/lib/typography/inter';

/** URL / swipe tabs — Completed maps from legacy `past`. Cancelled redirects to upcoming. */
type AppointmentTab = AppointmentsTabId;

function parseTabParam(value: string | string[] | undefined): AppointmentTab | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'upcoming') return 'upcoming';
  if (raw === 'past' || raw === 'completed') return 'completed';
  // Legacy cancelled deep-links land on upcoming (tab removed).
  if (raw === 'cancelled') return 'upcoming';
  return null;
}

const TAB_ORDER: AppointmentTab[] = ['upcoming', 'completed'];

const TAB_SWIPE_DISTANCE = 56;
const TAB_SWIPE_VELOCITY = 650;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DRAG_SPRING = { damping: 26, stiffness: 200, mass: 0.85 } as const;

function buildDetailRows(item: {
  dateKey: string;
  startLabel: string;
  reason?: string | null;
  clinicalNotes?: string | null;
}): AppointmentCardDetailRow[] {
  const dateValue = formatAppointmentBookedDate(item.dateKey);
  const timeValue = item.startLabel.trim();
  const reason = formatVisitReasonDisplay(item.reason) || 'Consultation';

  const rows: AppointmentCardDetailRow[] = [
    { label: 'Date', value: dateValue },
    { label: 'Time', value: timeValue },
    { label: 'Reason', value: reason },
  ];

  const notes = item.clinicalNotes?.trim();
  if (notes) {
    rows.push({ label: 'Clinical Notes', value: notes });
  }

  return rows;
}

/**
 * Appointments — Figma 4203:124 (privacy banner, tabs, search, white cards).
 */
export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = parseTabParam(tab) ?? 'upcoming';
  const [activeTab, setActiveTab] = useState<AppointmentTab>(initialTab);
  const [panelKey, setPanelKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    const parsed = parseTabParam(tab);
    if (parsed) setActiveTab(parsed);
  }, [tab]);

  useEffect(() => {
    tabIndexSV.set(TAB_ORDER.indexOf(activeTab));
  }, [activeTab, tabIndexSV]);

  useEffect(() => {
    reduceMotionSV.set(Boolean(reduceMotion));
  }, [reduceMotion, reduceMotionSV]);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([loadAppointments(), loadStaff()]);
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

  const onStatusChange = useCallback(
    (next: AppointmentTab) => {
      const current = TAB_ORDER.indexOf(activeTab);
      const nextIndex = TAB_ORDER.indexOf(next);
      if (nextIndex === current) return;
      goToTab(next, nextIndex > current ? 'forward' : 'back');
    },
    [activeTab, goToTab],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          if (reduceMotionSV.get()) return;
          dragX.set(e.translationX * 0.35);
        })
        .onEnd((e) => {
          const current = tabIndexSV.get();
          const shouldNext =
            e.translationX < -TAB_SWIPE_DISTANCE || e.velocityX < -TAB_SWIPE_VELOCITY;
          const shouldPrev =
            e.translationX > TAB_SWIPE_DISTANCE || e.velocityX > TAB_SWIPE_VELOCITY;

          if (shouldNext && current < TAB_ORDER.length - 1) {
            runOnJS(goToIndex)(current + 1);
          } else if (shouldPrev && current > 0) {
            runOnJS(goToIndex)(current - 1);
          }
          dragX.set(withSpring(0, DRAG_SPRING));
        }),
    [dragX, goToIndex, reduceMotionSV, tabIndexSV],
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.get() }],
  }));

  const deferredQuery = useDeferredValue(searchQuery);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    const list = appointments.filter((a) => {
      if (!matchesStatusFilter(a.status, activeTab)) return false;
      if (!q) return true;

      const { name, specialty } = resolveAppointmentStaffDisplay(a, staff);
      const haystack = [
        name,
        specialty,
        a.id,
        a.reason ?? '',
        a.checkInCode ?? '',
        a.staffName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

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
  }, [appointments, activeTab, deferredQuery, staff]);

  const emptyCopy = deferredQuery.trim()
    ? {
        title: 'No matches',
        body: 'Try another name, specialty, or reason',
      }
    : activeTab === 'upcoming'
      ? {
          title: 'No appointments yet',
          body: "You don't have any upcoming appointments\nright now",
        }
      : {
          title: 'No past appointments',
          body: "You haven't completed any visits yet",
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

  const cardVariant: AppointmentCardVariant =
    activeTab === 'upcoming' ? 'upcoming' : 'past';

  return (
    <HealthServiceScreenShell>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, zIndex: 2 }}>
          <CircleBackButton onPress={() => router.back()} />
        </View>
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
                <View style={{ gap: 4 }}>
                  <Text
                    accessibilityRole="header"
                    style={{
                      fontFamily: Inter.medium,
                      fontSize: 28,
                      color: '#222222',
                      letterSpacing: -2.24,
                      lineHeight: 38,
                    }}>
                    Appointments
                  </Text>
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 16,
                      color: '#727272',
                      letterSpacing: -0.64,
                      lineHeight: 20,
                    }}>
                    All your visits, prescriptions & reports in one place
                  </Text>
                </View>

                <AppointmentsPrivacyBanner />

                <AppointmentsStatusSegment value={activeTab} onChange={onStatusChange} />

                <AppointmentsSearchBar value={searchQuery} onChangeText={setSearchQuery} />
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
                      minHeight: 280,
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
                    const { name: doctorName, specialty, photoUrl: photo } =
                      resolveAppointmentStaffDisplay(item, staff);
                    const variant = cardVariant;

                    if (variant === 'upcoming') {
                      return (
                        <AppointmentCard
                          key={`${panelKey}-${item.id}`}
                          variant="upcoming"
                          enterIndex={index}
                          staffName={doctorName}
                          staffSpecialty={specialty}
                          staffPhoto={photo}
                          dateLabel={formatAppointmentCardDateTime(
                            item.dateKey,
                            item.startLabel,
                          )}
                          status={
                            item.status === 'pending' || item.status === 'confirmed'
                              ? item.status
                              : undefined
                          }
                          onPress={() =>
                            useAppointmentStatusStore.getState().open(item.id)
                          }
                        />
                      );
                    }

                    const detailRows = buildDetailRows(item);

                    return (
                      <AppointmentCard
                        key={`${panelKey}-${item.id}`}
                        variant="past"
                        enterIndex={index}
                        staffName={doctorName}
                        subtitle="Consulted by"
                        staffPhoto={photo}
                        detailRows={detailRows}
                        onPress={() =>
                          useConsultationSummaryStore.getState().open(item.id)
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
