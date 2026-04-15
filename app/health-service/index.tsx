import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppointmentListCard } from '../../components/health-service/AppointmentListCard';
import { HealthServiceAnnouncementCard } from '../../components/health-service/HealthServiceAnnouncementCard';
import { HealthServiceScreenShell } from '../../components/health-service/HealthServiceScreenShell';
import { ProviderCard } from '../../components/health-service/ProviderCard';
import { QueueTicketCard } from '../../components/health-service/QueueTicketCard';
import { RoleFilterChips } from '../../components/health-service/RoleFilterChips';
import { IconsaxSearchIcon } from '../../components/icons/IconsaxSearchIcon';
import { IconsaxSortIcon } from '../../components/icons/IconsaxSortIcon';
import { ScreenNavbar } from '../../components/ScreenNavbar';
import { SCHEDULE_PARTNER } from '../../lib/health-service/bookingScheduleTheme';
import { MOCK_STAFF } from '../../lib/health-service/mockStaff';
import { isStaffWorkingOnDate } from '../../lib/health-service/slotUtils';
import { formatAppointmentWhen } from '../../lib/health-service/appointmentDisplay';
import { staffNameForAppointment, useHealthServiceStore } from '../../lib/health-service/healthServiceStore';
import type { StaffRole } from '../../lib/health-service/types';
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

type AvailabilityFilter = 'all' | 'today';

const BRAND = SCHEDULE_PARTNER.brand;

const PROVIDER_GRID_GAP = 12;

export default function HealthServiceScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const providerCardWidth = (windowWidth - HOME_SCROLL_PADDING_H * 2 - PROVIDER_GRID_GAP) / 2;
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [savedProviderIds, setSavedProviderIds] = useState<Set<string>>(() => new Set());

  const appointments = useHealthServiceStore((s) => s.appointments);
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => dateKeyForDay(today), [today]);

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_STAFF.filter((s) => {
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      if (availabilityFilter === 'today' && !isStaffWorkingOnDate(s.id, today)) return false;
      if (q) {
        const name = s.name.toLowerCase();
        const spec = s.specialtyLabel.toLowerCase();
        if (!name.includes(q) && !spec.includes(q)) return false;
      }
      return true;
    });
  }, [roleFilter, availabilityFilter, search, today]);

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

  const segmentBtn = (selected: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: selected ? BRAND : 'transparent',
  });

  const hasActiveProviderFilters = roleFilter !== 'all' || availabilityFilter === 'today';

  const toggleSavedProvider = (staffId: string) => {
    setSavedProviderIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  return (
    <HealthServiceScreenShell>
      <ScreenNavbar
        title="How are you feeling today?"
        subtitle="Catherine Capellan"
        titleNumberOfLines={3}
        onBackPress={() => router.replace('/(tabs)')}
      />
      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
        }}>
        <View className="gap-5 pt-2">
          <View style={{ gap: 12 }}>
            <HealthServiceAnnouncementCard />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: SCHEDULE_PARTNER.textPrimary, letterSpacing: -0.2 }}>
                Upcoming appointments
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all appointments"
                onPress={() => router.push('/health-service/appointments')}
                hitSlop={8}
                className="active:opacity-80">
                <Text style={{ fontSize: 14, fontWeight: '400', color: BRAND }}>See all</Text>
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
            <Text style={{ fontSize: 18, fontWeight: '700', color: SCHEDULE_PARTNER.textPrimary, letterSpacing: -0.2 }}>
              Popular doctors
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(15, 23, 42, 0.08)',
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                }}>
                <IconsaxSearchIcon size={20} color={SCHEDULE_PARTNER.textMuted} />
                <TextInput
                  accessibilityLabel="Search providers by name or specialty"
                  placeholder="Search name or specialty…"
                  placeholderTextColor={SCHEDULE_PARTNER.textDisabled}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 0,
                    fontSize: 15,
                    fontWeight: '500',
                    color: SCHEDULE_PARTNER.textPrimary,
                  }}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open provider filters"
                accessibilityState={{ expanded: filterModalOpen }}
                onPress={() => setFilterModalOpen(true)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(15, 23, 42, 0.08)',
                }}
                className="active:opacity-85">
                <IconsaxSortIcon size={22} color={hasActiveProviderFilters ? BRAND : SCHEDULE_PARTNER.textMuted} />
                {hasActiveProviderFilters ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: BRAND,
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}
                  />
                ) : null}
              </Pressable>
            </View>

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
                      availableToday={isStaffWorkingOnDate(staff.id, today)}
                      saved={savedProviderIds.has(staff.id)}
                      onToggleSave={() => toggleSavedProvider(staff.id)}
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
