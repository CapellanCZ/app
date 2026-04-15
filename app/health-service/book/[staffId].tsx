import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  HealthBookingDateStrip,
  HealthBookingFeelingGroup,
  HEALTH_BOOKING_FEELING_OPTIONS,
} from '../../../components/health-service/HealthBookingDateStrip';
import { HealthServiceScreenShell } from '../../../components/health-service/HealthServiceScreenShell';
import { PeriodTabs } from '../../../components/health-service/PeriodTabs';
import { TimeSlotGrid } from '../../../components/health-service/TimeSlotGrid';
import { ScreenNavbar } from '../../../components/ScreenNavbar';
import { getHealthServiceApi } from '../../../lib/health-service/healthServiceApi';
import { getStaffById } from '../../../lib/health-service/mockStaff';
import { getSlotLabelsForPeriod, isStaffWorkingOnDate } from '../../../lib/health-service/slotUtils';
import type { SlotPeriod } from '../../../lib/health-service/types';
import { HOME_SCROLL_PADDING_H } from '../../../lib/ui/screenGradients';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d: Date): string {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function roleLabel(role: string): string {
  if (role === 'doctor') return 'Doctor';
  if (role === 'nurse') return 'Nurse';
  return 'Dentist';
}

export default function HealthServiceBookScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const insets = useSafeAreaInsets();
  const healthApi = useMemo(() => getHealthServiceApi(), []);

  const staff = useMemo(() => (staffId ? getStaffById(String(staffId)) : undefined), [staffId]);

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [period, setPeriod] = useState<SlotPeriod>('morning');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [feelingIds, setFeelingIds] = useState<string[]>([]);
  const [visitComments, setVisitComments] = useState('');

  const working = staff ? isStaffWorkingOnDate(staff.id, selectedDay) : false;
  const dk = dateKey(selectedDay);

  const slotLabels = useMemo(() => {
    if (!staff || !working) return [];
    return getSlotLabelsForPeriod(staff.id, dk, period);
  }, [staff, working, dk, period]);

  const onBook = useCallback(() => {
    if (!staff || !selectedSlot) return;
    const feelingLabels = feelingIds
      .map((id) => HEALTH_BOOKING_FEELING_OPTIONS.find((o) => o.id === id)?.label)
      .filter(Boolean)
      .join(', ');
    const extra =
      [feelingLabels ? `Symptoms / concerns: ${feelingLabels}` : null, visitComments.trim() ? `Comments: ${visitComments.trim()}` : null]
        .filter(Boolean)
        .join('\n') || 'No extra symptoms or comments added.';

    Alert.alert(
      'Submit booking request?',
      `Request ${selectedSlot} on ${selectedDay.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} with ${staff.name}?\n\n${extra}\n\nA provider will review it before it is confirmed. Once confirmed, an arrival ticket is created automatically (demo).`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            void healthApi.bookAppointment({
              staffId: staff.id,
              day: selectedDay,
              startLabel: selectedSlot,
            });
            Alert.alert(
              'Request sent',
              'Your booking is pending provider review. You will see it under My appointments with a Pending status. After approval, your visit is confirmed and a ticket is added automatically (demo).',
              [{ text: 'OK', onPress: () => router.back() }],
            );
          },
        },
      ],
    );
  }, [staff, selectedSlot, selectedDay, healthApi, feelingIds, visitComments]);

  if (!staff) {
    return (
      <HealthServiceScreenShell>
        <ScreenNavbar title="Book" onBackPress={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[#535862]">Provider not found.</Text>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="font-semibold text-[#2970FF]">Go back</Text>
          </Pressable>
        </View>
      </HealthServiceScreenShell>
    );
  }

  const rating = staff.rating ?? 4.8;

  return (
    <HealthServiceScreenShell>
      <View className="flex-1">
        <ScreenNavbar title="Book visit" onBackPress={() => router.back()} />
        <ScrollView
          className="flex-1 bg-transparent"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: HOME_SCROLL_PADDING_H,
            paddingBottom: 120 + Math.max(insets.bottom, 8),
          }}>
          <View className="overflow-hidden rounded-3xl">
            <LinearGradient
              colors={['#2970FF', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20 }}>
              <Text className="text-2xl font-bold text-white" numberOfLines={2}>
                {staff.name}
              </Text>
              <Text className="mt-1 text-sm text-white/90">
                {roleLabel(staff.role)} · {staff.specialtyLabel}
              </Text>
              <Text className="mt-3 text-xs font-medium text-white/80">
                {staff.priceLabel ?? 'Session fee — demo'}
              </Text>

              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={28}
                  tint="light"
                  style={{
                    marginTop: 16,
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)',
                  }}>
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="star" size={16} color="#FBBF24" />
                      <Text className="text-sm font-semibold text-[#1F2024]">{rating.toFixed(1)}</Text>
                      <Text className="text-xs text-[#535862]">Student reviews (mock)</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add to favorites"
                      hitSlop={10}
                      className="h-10 w-10 items-center justify-center rounded-full bg-white/70 active:opacity-80">
                      <Ionicons name="heart-outline" size={20} color="#2970FF" />
                    </Pressable>
                  </View>
                </BlurView>
              ) : (
                <View className="mt-4 overflow-hidden rounded-2xl border border-white/25 bg-white/85">
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="star" size={16} color="#FBBF24" />
                      <Text className="text-sm font-semibold text-[#1F2024]">{rating.toFixed(1)}</Text>
                      <Text className="text-xs text-[#535862]">Student reviews (mock)</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add to favorites"
                      hitSlop={10}
                      className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-80">
                      <Ionicons name="heart-outline" size={20} color="#2970FF" />
                    </Pressable>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          <View className="mt-6">
            <HealthBookingDateStrip
              selectedDay={selectedDay}
              onSelectDay={(d) => {
                setSelectedDay(startOfDay(d));
                setSelectedSlot(null);
              }}
            />
          </View>

          <View className="mt-6">
            <Text className="text-lg font-semibold text-[#1F2024]">Select Time</Text>
            <View className="mt-2">
              <PeriodTabs
                value={period}
                onChange={(p) => {
                  setPeriod(p);
                  setSelectedSlot(null);
                }}
              />
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-lg font-semibold text-[#1F2024]">Available slots</Text>
            {!working ? (
              <Text className="mt-3 rounded-2xl border border-black/5 bg-white px-4 py-6 text-center text-sm text-[#8F9098]">
                No clinic hours on this day for this provider (mock schedule).
              </Text>
            ) : slotLabels.length === 0 ? (
              <Text className="mt-3 rounded-2xl border border-black/5 bg-white px-4 py-6 text-center text-sm text-[#8F9098]">
                No open slots in this period. Try another time of day.
              </Text>
            ) : (
              <Animated.View
                key={`${dk}-${period}`}
                entering={FadeIn.duration(220)}
                className="mt-3">
                <TimeSlotGrid labels={slotLabels} selectedLabel={selectedSlot} onSelect={setSelectedSlot} />
              </Animated.View>
            )}
          </View>

          <View className="mt-6">
            <HealthBookingFeelingGroup
              selectedIds={feelingIds}
              onSelectedIdsChange={setFeelingIds}
              comments={visitComments}
              onCommentsChange={setVisitComments}
            />
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-black/5 bg-white/90 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit booking request"
            accessibilityState={{ disabled: !selectedSlot }}
            onPress={onBook}
            disabled={!selectedSlot}
            className="overflow-hidden rounded-2xl active:opacity-90"
            style={{ opacity: selectedSlot ? 1 : 0.45 }}>
            <LinearGradient
              colors={['#2970FF', '#1D4ED8']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-base font-semibold text-white">Submit request</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </HealthServiceScreenShell>
  );
}
