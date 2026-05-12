import { useMemo, useState, useEffect, useCallback } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppointmentListCard } from '../../components/health-service/AppointmentListCard';
import { HealthServiceAnnouncementCard } from '../../components/health-service/HealthServiceAnnouncementCard';
import { HealthServiceScreenShell } from '../../components/health-service/HealthServiceScreenShell';
import { ProviderCard } from '../../components/health-service/ProviderCard';
import { QueueTicketCard } from '../../components/health-service/QueueTicketCard';
import { RoleFilterChips } from '../../components/health-service/RoleFilterChips';
import { ScholarshipSearchBar } from '../../components/student-development-affairs/ScholarshipSearchBar';
import { TAB_BAR_HEIGHT } from '../../components/layout/BottomTabBar';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SCHEDULE_PARTNER } from '../../lib/health-service/bookingScheduleTheme';
import { healthServiceApi } from '../../lib/health-service/healthServiceApi';
import { formatAppointmentWhen } from '../../lib/health-service/appointmentDisplay';
import { useHealthServiceStore, staffNameForAppointment } from '../../lib/health-service/healthServiceStore';
import type { StaffRole } from '../../lib/health-service/types';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKeyForDay(d: Date): string {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

const BRAND = SCHEDULE_PARTNER.brand;
const PROVIDER_GRID_GAP = 12;

export default function HealthServiceScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const providerCardWidth = (windowWidth - 16 * 2 - PROVIDER_GRID_GAP) / 2;
  
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'today'>('all');
  const [search, setSearch] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Zustand store
  const { 
    appointments, 
    staff, 
    loading, 
    error,
    loadAppointments, 
    loadStaff, 
    refreshData 
  } = useHealthServiceStore();

  const todayKey = useMemo(() => dateKeyForDay(startOfDay(new Date())), []);

  // Load data on mount
  useEffect(() => {
    loadAppointments();
    loadStaff();
  }, [loadAppointments, loadStaff]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      // Also expire old tickets
      await healthServiceApi.expireOldTickets();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const segmentBtn = (selected: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: selected ? BRAND : 'transparent',
  });

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      if (q) {
        const name = s.name.toLowerCase();
        const spec = s.specialtyLabel.toLowerCase();
        if (!name.includes(q) && !spec.includes(q)) return false;
      }
      return true;
    });
  }, [roleFilter, search, staff]);

  const active = useMemo(() => {
    return appointments
      .filter((a) => a.status !== 'cancelled')
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
        return a.startLabel.localeCompare(b.startLabel);
      });
  }, [appointments]);

  /** Hub preview: one confirmed visit only (pending lives under See all). */
  const upcomingPreview = useMemo(() => {
    return active
      .filter((a) => a.status === 'confirmed')
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
        return a.startLabel.localeCompare(b.startLabel);
      })
      .slice(0, 1);
  }, [active]);

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

  const hasActiveProviderFilters = roleFilter !== 'all';

  return (
    <HealthServiceScreenShell>
      <ScreenHeader
        title="Health Service"
        subtitle="Book appointments and track your queue status."
        paddingBottom={8}
      />
      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 8,
        }}>
        <View className="gap-5 pt-2">
          <View style={{ gap: 12 }}>
            <HealthServiceAnnouncementCard />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '500', color: SCHEDULE_PARTNER.textPrimary, letterSpacing: -0.2 }}>
                Upcoming appointments
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all appointments"
                onPress={() => router.push('/health-service/appointments')}
                hitSlop={8}
                className="active:opacity-80">
                <Text style={{ fontSize: 14, fontWeight: '400', color: '#717680'}}>See all</Text>
              </Pressable>
            </View>
            <View style={{ gap: 12 }}>
              {upcomingPreview.length === 0 ? (
                <Text style={{ paddingVertical: 20, textAlign: 'center', fontSize: 14, color: SCHEDULE_PARTNER.textDisabled }}>
                  No confirmed visits to show here yet. Tap See all for pending requests, or book a doctor below.
                </Text>
              ) : (
                upcomingPreview.map((item) => (
                  <AppointmentListCard
                    key={item.id}
                    appointment={item}
                    staffName={staffNameForAppointment(item)}
                    whenLabel={formatAppointmentWhen(item)}
                    onPress={() =>
                      router.push({ pathname: '/health-service/appointment/[id]', params: { id: item.id } })
                    }
                  />
                ))
              )}
            </View>
          </View>

         
          <View style={{ gap: 12, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: SCHEDULE_PARTNER.textPrimary, letterSpacing: -0.2 }}>Our Doctors</Text>
              <Text style={{ fontSize: 14, fontWeight: '400', color: '#717680' }}>See All</Text>
            </View>
            <ScholarshipSearchBar
              accessibilityLabel="Search providers by name or specialty"
              placeholder="Search name or specialty…"
              value={search}
              onChangeText={setSearch}
              onSortPress={() => setFilterModalOpen(true)}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: PROVIDER_GRID_GAP }}>
              {filteredStaff.length === 0 ? (
                <Text style={{ width: '100%', paddingVertical: 16, textAlign: 'center', fontSize: 14, color: SCHEDULE_PARTNER.textDisabled }}>
                  No providers match your search or filters.
                </Text>
              ) : (
                filteredStaff.map((staff) => (
                  <View key={staff.id} style={{ width: providerCardWidth }}>
                    <ProviderCard
                      staff={staff}
                      availableToday={true}
                      onPress={() => router.push(`/health-service/book/${staff.id}`)}
                    />
                  </View>
                ))
              )}
            </View>
          </View>

        </View>
      </ScrollView>

      <Modal visible={filterModalOpen} transparent animationType="fade" onRequestClose={() => setFilterModalOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel="Close filters"
            onPress={() => setFilterModalOpen(false)}
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]}
          />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: SCHEDULE_PARTNER.divider,
              gap: 16,
            }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
            <View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: SCHEDULE_PARTNER.textPrimary }}>Filters</Text>
              <Text style={{ marginTop: 6, fontSize: 16, fontWeight: '400', lineHeight: 22, color: SCHEDULE_PARTNER.textMuted }}>
                Choose a role and whether to show only providers on today&apos;s schedule.
              </Text>
            </View>

            <View>
              <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: '500', color: SCHEDULE_PARTNER.textMuted }}>Role</Text>
              <RoleFilterChips value={roleFilter} onChange={setRoleFilter} />
            </View>

            <View>
              <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: '500', color: SCHEDULE_PARTNER.textMuted }}>Availability</Text>
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: SCHEDULE_PARTNER.segmentTrackBorder,
                  backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
                  padding: 4,
                  gap: 4,
                }}>
                {(['all', 'today'] as const).map((id) => {
                  const selected = availabilityFilter === id;
                  const label = id === 'all' ? 'Everyone' : 'Available today';
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={label}
                      onPress={() => setAvailabilityFilter(id)}
                      style={{ flex: 1, ...segmentBtn(selected) }}
                      className="active:opacity-90">
                      <Text
                        style={{
                          textAlign: 'center',
                          fontSize: 16,
                          fontWeight: selected ? '600' : '400',
                          color: selected ? '#FFFFFF' : SCHEDULE_PARTNER.textMuted,
                        }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset provider filters"
                onPress={() => {
                  setRoleFilter('all');
                  setAvailabilityFilter('all');
                }}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: SCHEDULE_PARTNER.segmentTrackBorder,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                className="active:opacity-85">
                <Text style={{ fontSize: 16, fontWeight: '500', color: SCHEDULE_PARTNER.textMuted }}>Reset</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={() => setFilterModalOpen(false)}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: BRAND,
                }}
                className="active:opacity-90">
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </HealthServiceScreenShell>
  );
}

const styles = StyleSheet.create({
  adminButton: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1EFFE',
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  adminButtonSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2970FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});