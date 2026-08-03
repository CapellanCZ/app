import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { DoctorListCard } from '@/components/health-service/DoctorListCard';
import { HealthServiceScreenShell } from '@/components/health-service/HealthServiceScreenShell';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { healthServiceApi, type StaffPresenceStatus } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import type { StaffRole } from '@/lib/health-service/types';
import { Inter } from '@/lib/typography/inter';

type FilterId = 'all' | 'doctor' | 'dentist';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'doctor', label: 'Physician' },
  { id: 'dentist', label: 'Dentist' },
];

/**
 * School Doctors — Figma node 2243:333.
 */
export default function AllDoctorsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterId>('all');
  const [presence, setPresence] = useState<Record<string, StaffPresenceStatus>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const { staff, loadStaff } = useHealthServiceStore();

  useFocusEffect(
    useCallback(() => {
      if (!staff.length) void loadStaff();
    }, [loadStaff, staff.length]),
  );

  const doctors = useMemo(
    () => staff.filter((s) => s.role === 'doctor' || s.role === 'dentist'),
    [staff],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return doctors;
    return doctors.filter((s) => s.role === (filter as StaffRole));
  }, [doctors, filter]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!doctors.length) {
        setPresence({});
        return;
      }
      setLoadingAvailability(true);
      const today = new Date();
      try {
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
        if (!cancelled) {
          setPresence(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) setLoadingAvailability(false);
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [doctors]);

  return (
    <HealthServiceScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
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
                  onPress={() => setFilter(chip.id)}
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
        <View style={{ gap: 12 }}>
          {!staff.length || loadingAvailability ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#111" />
            </View>
          ) : filtered.length === 0 ? (
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
          ) : (
            filtered.map((s) => (
              <DoctorListCard
                key={s.id}
                staff={s}
                status={presence[s.id] ?? 'unavailable'}
                onPress={() => router.push(`/health-service/book/${s.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}
