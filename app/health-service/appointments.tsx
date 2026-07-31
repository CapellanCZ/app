import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { AppointmentListCard } from '../../components/health-service/AppointmentListCard';
import { HealthServiceScreenShell } from '../../components/health-service/HealthServiceScreenShell';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { IconsaxCalendarSearchIcon } from '@/components/icons/IconsaxCalendarSearchIcon';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { formatAppointmentDateLong } from '../../lib/health-service/appointmentDisplay';
import { useHealthServiceStore } from '../../lib/health-service/healthServiceStore';

type AppointmentTab = 'pending' | 'confirmed' | 'completed';

const TABS: { id: AppointmentTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
];

export default function HealthServiceAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('pending');

  const appointments = useHealthServiceStore((s) => s.appointments);
  const staff = useHealthServiceStore((s) => s.staff);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const loadStaff = useHealthServiceStore((s) => s.loadStaff);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      if (!staff.length) loadStaff();
    }, [loadAppointments, loadStaff, staff.length]),
  );

  const active = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => {
        if (a.status === 'cancelled') return false;
        if (a.status === 'pending' && a.createdAt) {
          const expiry = new Date(a.createdAt).getTime() + 60 * 60 * 1000;
          if (expiry < now) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
        return a.startLabel.localeCompare(b.startLabel);
      });
  }, [appointments]);

  const filtered = useMemo(() => {
    if (activeTab === 'completed') return [];
    return active.filter((a) => a.status === activeTab);
  }, [active, activeTab]);

  return (
    <HealthServiceScreenShell>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 8,
          gap: 24,
        }}>

        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 20,
        }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F0F0F0',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <IconsaxArrowLeftIcon size={20} color="#181D27" />
          </Pressable>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '600', color: '#000000', letterSpacing: -0.48 }}>
              Appointments
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '300', color: '#535862', letterSpacing: -0.28 }}>
              Track the status of your booked appointment here
            </Text>
          </View>
        </View>

        {/* ── Content: tab bar + list ── */}
        <View style={{ paddingHorizontal: 20, gap: 24 }}>

          {/* Tab bar — #F5F5F5 track, white pill for selected */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#F5F5F5',
            borderRadius: 100,
            padding: 4,
          }}>
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    height: 33,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#FFFFFF' : 'transparent',
                  }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: selected ? '500' : '400',
                    color: selected ? '#007AFF' : '#090909',
                    letterSpacing: -0.23,
                  }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Appointment list */}
          <View style={{ gap: 24 }}>
            {filtered.length === 0 ? (
              <View
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 28,
                  gap: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <IconsaxCalendarSearchIcon size={48} color="#A4A7AE" />
                <View style={{ gap: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#717680', letterSpacing: -0.32, textAlign: 'center' }}>
                    {activeTab === 'pending'
                      ? 'No Pending Appointments'
                      : activeTab === 'confirmed'
                      ? 'No Confirmed Appointments'
                      : 'No Completed Appointments'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#A4A7AE', letterSpacing: -0.24, textAlign: 'center' }}>
                    {activeTab === 'pending'
                      ? "You don't have any pending appointments right now."
                      : activeTab === 'confirmed'
                      ? 'Your confirmed appointments will appear here.'
                      : 'Completed appointments will show up here.'}
                  </Text>
                </View>
              </View>
            ) : (
              filtered.map((item) => {
                const staffMember = staff.find((s) => s.id === item.staffId);
                return (
                  <AppointmentListCard
                    key={item.id}
                    appointment={item}
                    staffName={staffMember?.name ?? 'Unknown Doctor'}
                    staffPhoto={staffMember?.photoUrl}
                    staffRating={staffMember?.rating}
                    staffSpecialty={staffMember?.specialtyLabel}
                    onPress={() =>
                      router.push({
                        pathname: '/health-service/appointment-booked',
                        params: {
                          id: item.id,
                          doctorName: staffMember?.name ?? 'Unknown Doctor',
                          appointmentDate: formatAppointmentDateLong(item),
                          appointmentTime: item.startLabel,
                          checkInCode: item.checkInCode ?? 'CH-0000',
                          expiresAt: item.createdAt
                            ? new Date(new Date(item.createdAt).getTime() + 60 * 60 * 1000).toISOString()
                            : undefined,
                        },
                      })
                    }
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}
