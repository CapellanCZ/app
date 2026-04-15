import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { confirmCancelAppointment } from '../../components/health-service/CancelAppointmentDialog';
import { HealthServiceScreenShell } from '../../components/health-service/HealthServiceScreenShell';
import { ProviderCard } from '../../components/health-service/ProviderCard';
import { QueueTicketCard } from '../../components/health-service/QueueTicketCard';
import { RoleFilterChips } from '../../components/health-service/RoleFilterChips';
import { ScreenNavbar } from '../../components/ScreenNavbar';
import { getHealthServiceApi } from '../../lib/health-service/healthServiceApi';
import { MOCK_STAFF } from '../../lib/health-service/mockStaff';
import { isStaffWorkingOnDate } from '../../lib/health-service/slotUtils';
import { staffNameForAppointment, useHealthServiceStore } from '../../lib/health-service/healthServiceStore';
import type { Appointment, StaffRole } from '../../lib/health-service/types';
import { HOME_SCROLL_PADDING_H } from '../../lib/ui/screenGradients';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKeyForDay(d: Date): string {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((n) => Number(n));
  return new Date(y, m - 1, d);
}

function formatAppointmentWhen(a: Appointment): string {
  const day = parseDateKey(a.dateKey);
  const datePart = day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${datePart} · ${a.startLabel}`;
}

const ROW_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;

export default function HealthServiceScreen() {
  const insets = useSafeAreaInsets();
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  const appointments = useHealthServiceStore((s) => s.appointments);
  const healthApi = useMemo(() => getHealthServiceApi(), []);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => dateKeyForDay(today), [today]);

  const filteredStaff = useMemo(() => {
    if (roleFilter === 'all') return MOCK_STAFF;
    return MOCK_STAFF.filter((s) => s.role === roleFilter);
  }, [roleFilter]);

  const active = useMemo(() => {
    return appointments
      .filter((a) => a.status !== 'cancelled')
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
        return a.startLabel.localeCompare(b.startLabel);
      });
  }, [appointments]);

  const todayConfirmedWithTicket = useMemo(() => {
    const hit = active.find(
      (a) => a.dateKey === todayKey && a.status === 'confirmed' && a.arrivalTicket,
    );
    return hit ?? null;
  }, [active, todayKey]);

  const hasPendingToday = useMemo(
    () => active.some((a) => a.dateKey === todayKey && a.status === 'pending'),
    [active, todayKey],
  );

  return (
    <HealthServiceScreenShell>
      <ScreenNavbar title="Health Service" onBackPress={() => router.replace('/(tabs)')} />
      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
        }}>
        <View className="gap-5 pt-2">
          <Text className="text-sm leading-5 text-[#535862]">
            Choose a provider, date, and time to submit a booking request. A provider reviews it before it is
            confirmed. Once confirmed, an arrival ticket is created for you automatically (demo).
          </Text>

          <View>
            <Text className="text-lg font-semibold text-[#1F2024]">Providers</Text>
            <View className="mt-2">
              <RoleFilterChips value={roleFilter} onChange={setRoleFilter} />
            </View>
            <View className="mt-3 gap-3">
              {filteredStaff.map((staff) => (
                <ProviderCard
                  key={staff.id}
                  staff={staff}
                  availableToday={isStaffWorkingOnDate(staff.id, today)}
                  onBook={() => router.push(`/health-service/book/${staff.id}`)}
                />
              ))}
            </View>
          </View>

          <QueueTicketCard todayConfirmedWithTicket={todayConfirmedWithTicket} hasPendingToday={hasPendingToday} />

          <View>
            <Text className="text-lg font-semibold text-[#1F2024]">My appointments</Text>
            <Text className="mt-1 text-xs text-[#8F9098]">
              Pending = awaiting provider. Confirmed = approved; your ticket is issued then (demo).
            </Text>
            <View className="mt-2 overflow-hidden rounded-3xl bg-white" style={ROW_SHADOW}>
              {active.length === 0 ? (
                <Text className="px-4 py-10 text-center text-sm text-[#8F9098]">
                  No booking requests yet. Book a provider above.
                </Text>
              ) : (
                active.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <View className="mx-4 h-px bg-[#EEF0F3]" /> : null}
                    <View className="gap-2 px-4 py-3">
                      <View className="flex-row items-start gap-3">
                        <View
                          className="rounded-2xl px-3 py-2"
                          style={{
                            backgroundColor: item.status === 'pending' ? '#FEF3C7' : '#DBEAFE',
                          }}>
                          <Text
                            className="text-center text-xs font-bold"
                            style={{ color: item.status === 'pending' ? '#92400E' : '#1D4ED8' }}
                            numberOfLines={1}>
                            {item.startLabel}
                          </Text>
                        </View>
                        <View className="min-w-0 flex-1">
                          <View className="flex-row flex-wrap items-center gap-2">
                            <Text className="text-sm font-semibold text-[#1F2024]" numberOfLines={1}>
                              {staffNameForAppointment(item)}
                            </Text>
                            {item.status === 'pending' ? (
                              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                                <Text className="text-[10px] font-bold uppercase text-amber-900">Pending</Text>
                              </View>
                            ) : (
                              <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                                <Text className="text-[10px] font-bold uppercase text-emerald-900">Confirmed</Text>
                              </View>
                            )}
                          </View>
                          <Text className="mt-0.5 text-xs text-[#8F9098]" numberOfLines={2}>
                            {formatAppointmentWhen(item)}
                          </Text>
                          {item.status === 'confirmed' && item.arrivalTicket ? (
                            <Text className="mt-1 text-xs font-medium text-[#535862]">
                              Ticket {item.arrivalTicket.code} · Queue #{item.arrivalTicket.position} · ~
                              {item.arrivalTicket.estimatedMinutes} min
                            </Text>
                          ) : item.status === 'pending' ? (
                            <Text className="mt-1 text-xs text-[#A16207]">
                              A provider will review this request before it is confirmed.
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Cancel ${item.status === 'pending' ? 'request' : 'appointment'} with ${staffNameForAppointment(item)}`}
                          onPress={() =>
                            confirmCancelAppointment({
                              staffName: staffNameForAppointment(item),
                              whenLabel: formatAppointmentWhen(item),
                              status: item.status,
                              onConfirm: () => {
                                void healthApi.cancelAppointment(item.id);
                              },
                            })
                          }
                          hitSlop={8}
                          className="rounded-xl border border-red-200 px-3 py-2 active:opacity-80">
                          <Text className="text-xs font-semibold text-red-600">Cancel</Text>
                        </Pressable>
                      </View>
                      {item.status === 'pending' ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Simulate provider confirming this appointment for demo"
                          onPress={() => {
                            void healthApi.confirmAppointmentByProvider(item.id);
                          }}
                          className="self-start rounded-xl bg-[#2970FF] px-3 py-2 active:opacity-90">
                          <Text className="text-xs font-semibold text-white">
                            Simulate provider confirms (demo)
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}
