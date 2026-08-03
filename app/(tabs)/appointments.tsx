import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

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

const TABS: { id: AppointmentTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
];

/**
 * Appointments tab — Figma node 2229:500.
 */
export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppointmentTab>('pending');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const appointments = useHealthServiceStore((s) => s.appointments);
  const staff = useHealthServiceStore((s) => s.staff);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);
  const loadStaff = useHealthServiceStore((s) => s.loadStaff);
  const cancelAppointment = useHealthServiceStore((s) => s.cancelAppointment);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      if (!staff.length) loadStaff();
    }, [loadAppointments, loadStaff, staff.length]),
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const list = appointments.filter((a) => {
      if (a.status !== activeTab) return false;
      if (activeTab === 'pending' && a.createdAt) {
        const expiry = new Date(a.createdAt).getTime() + 60 * 60 * 1000;
        if (expiry < now) return false;
      }
      return true;
    });

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

  return (
    <HealthServiceScreenShell>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
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
                  onPress={() => setActiveTab(tab.id)}
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

        <View style={{ gap: 12, width: '100%' }}>
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
                  staffName={doctorName}
                  staffSpecialty={staffMember?.specialtyLabel ?? 'Physician'}
                  staffPhoto={staffMember?.photoUrl}
                  dateLabel={formatAppointmentCardDate(item.dateKey)}
                  timeLabel={timeLabel}
                  backgroundColor={APPOINTMENT_CARD_COLORS[index % APPOINTMENT_CARD_COLORS.length]}
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
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}
