import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import {
  MEDICAL_RECORD_CARD_COLORS,
  MedicalRecordCard,
} from '@/components/history/MedicalRecordCard';
import { IconsaxDocumentTextIcon } from '@/components/icons/IconsaxDocumentTextIcon';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import {
  formatAppointmentCardDate,
  formatAppointmentDateLong,
} from '@/lib/health-service/appointmentDisplay';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { StaffRole } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';

type RoleTab = 'physician' | 'dentist';

const TABS: { id: RoleTab; label: string; roles: StaffRole[] }[] = [
  { id: 'physician', label: 'Physician', roles: ['doctor', 'nurse'] },
  { id: 'dentist', label: 'Dentist', roles: ['dentist'] },
];

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

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 8,
          gap: 20,
        }}>
        <View style={{ gap: 16 }}>
          <View>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 28,
                color: '#222222',
                letterSpacing: -2.24,
                lineHeight: 38,
              }}>
              Medical Records
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 16,
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
                      fontSize: 15,
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

        {visits.length === 0 ? (
          <View
            style={{
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 40,
              gap: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <IconsaxDocumentTextIcon size={48} color="#A4A7AE" />
            <View style={{ gap: 4, alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 16,
                  color: '#717680',
                  letterSpacing: -0.32,
                  textAlign: 'center',
                }}>
                No Visit History Yet
              </Text>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 12,
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
                  fontSize: 14,
                  color: '#FFFFFF',
                }}>
                Book a visit
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12, width: '100%' }}>
            {visits.map((item, index) => {
              const staffMember = staff.find((s) => s.id === item.staffId);
              const doctorName = staffMember?.name ?? 'Clinic staff';
              const reason = item.reason?.trim() || 'Clinic visit';

              return (
                <MedicalRecordCard
                  key={item.id}
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
                        appointmentDate: formatAppointmentDateLong(item),
                        appointmentTime: item.startLabel,
                        checkInCode: item.checkInCode ?? '—',
                      },
                    })
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
