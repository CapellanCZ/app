import { useMemo, useState, useEffect, useCallback } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HealthServiceScreenShell } from '../../components/health-service/HealthServiceScreenShell';
import { ProviderCard } from '../../components/health-service/ProviderCard';
import { TAB_BAR_HEIGHT } from '../../components/layout/BottomTabBar';
import { healthServiceApi } from '../../lib/health-service/healthServiceApi';
import { useHealthServiceStore, staffNameForAppointment } from '../../lib/health-service/healthServiceStore';
import { useAuth } from '../../lib/auth/AuthProvider';
import { fetchStudentProfile } from '../../lib/profile/profileApi';
import { HomeScreenHeader } from '@/components/home/HomeScreenHeader';
import { IconsaxSearchIcon } from '../../components/icons/IconsaxSearchIcon';
import { IconsaxCalendarIcon } from '../../components/icons/IconsaxCalendarIcon';
import { IconsaxTimerIcon } from '../../components/icons/IconsaxTimerIcon';
import type { StaffRole } from '../../lib/health-service/types';

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${dayNames[date.getDay()]}, ${d} ${monthNames[m - 1]}`;
}

const BRAND = '#2970FF';

const ROLE_CHIPS: { label: string; value: StaffRole | 'all' }[] = [
  { label: 'Physician', value: 'doctor' },
  { label: 'Dentist', value: 'dentist' },
  { label: 'Cardiology', value: 'all' },
  { label: 'Psychiatrist', value: 'all' },
];

export default function HealthServiceScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const { session } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    appointments,
    staff,
    loadAppointments,
    loadStaff,
    refreshData,
  } = useHealthServiceStore();

  useEffect(() => {
    loadAppointments();
    loadStaff();
  }, [loadAppointments, loadStaff]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchStudentProfile(session.user.id).then((p) => {
      if (p?.avatar_url) setAvatarUrl(p.avatar_url);
    });
  }, [session?.user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await healthServiceApi.expireOldTickets();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      if (q) {
        if (!s.name.toLowerCase().includes(q) && !s.specialtyLabel.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [roleFilter, search, staff]);

  const upcomingItem = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'confirmed')
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
        return a.startLabel.localeCompare(b.startLabel);
      })[0] ?? null;
  }, [appointments]);

  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status === 'confirmed').length,
    [appointments],
  );

  const upcomingStaffName = upcomingItem ? staffNameForAppointment(upcomingItem) : '';
  const upcomingStaff = upcomingItem ? staff.find((s) => s.name === upcomingStaffName) : null;

  // Grid: 2 columns with 29px gap (matching Figma), 16px side padding
  const cardWidth = (windowWidth - 16 * 2 - 29) / 2;

  return (
    <HealthServiceScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 8,
        }}>

        {/* ══════════════════════════════════════
            GREY HEADER CARD  (#F5F5F5, r-32)
            Contains: greeting, search, upcoming
        ══════════════════════════════════════ */}
        <View style={{ padding: 8 }}>
          <View
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 32,
              paddingTop: insets.top,
              paddingBottom: 20,
              paddingHorizontal: 14,
              gap: 24,
            }}>

            <HomeScreenHeader title="Clinic" avatarUrl={avatarUrl} />

            {/* ── Search bar ── */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 9999,
                height: 45,
                paddingHorizontal: 16,
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
                elevation: 2,
              }}>
              <IconsaxSearchIcon size={16} color="#71717A" />
              <TextInput
                accessibilityLabel="Search providers"
                placeholder="Find the right doctor for you..."
                placeholderTextColor="#71717A"
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, fontSize: 16, fontWeight: '300', color: '#000', padding: 0 }}
              />
            </View>

            {/* ── Upcoming Schedule ── */}
            <View style={{ gap: 12 }}>
              {/* Section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 20, fontWeight: '500', color: '#000000' }}>
                    Upcoming Schedule
                  </Text>
                  {confirmedCount > 0 && (
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        backgroundColor: '#F64235',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text style={{ fontSize: 10, fontWeight: '400', color: '#FFF', textAlign: 'center', lineHeight: 12 }}>
                        {confirmedCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="See all appointments"
                  onPress={() => router.push('/health-service/appointments')}
                  hitSlop={10}
                  className="active:opacity-70">
                  <Text style={{ fontSize: 14, fontWeight: '400', color: '#717680' }}>See All</Text>
                </Pressable>
              </View>

              {/* Blue appointment card */}
              {upcomingItem ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Appointment with ${upcomingStaffName}`}
                  onPress={() =>
                    router.push({ pathname: '/health-service/appointment/[id]', params: { id: upcomingItem.id } })
                  }
                  style={{
                    backgroundColor: BRAND,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 20,
                    gap: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.02,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  className="active:opacity-90">

                  {/* Doctor row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 }}>
                      {/* Doctor photo */}
                      <View
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 9999,
                          overflow: 'hidden',
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          flexShrink: 0,
                        }}>
                        {upcomingStaff?.photoUrl ? (
                          <Image
                            source={{ uri: upcomingStaff.photoUrl }}
                            style={{ width: 54, height: 54 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="person" size={26} color="rgba(255,255,255,0.8)" />
                          </View>
                        )}
                      </View>

                      {/* Name + rating */}
                      <View style={{ gap: 4, flex: 1 }}>
                        <Text
                          style={{ fontSize: 20, fontWeight: '600', color: '#FDFDFD', letterSpacing: -0.8 }}
                          numberOfLines={1}>
                          {upcomingStaffName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="star" size={12} color="#FDB022" />
                          <Text style={{ fontSize: 12, fontWeight: '400', color: '#FDFDFD' }}>
                            4.6 • {upcomingStaff?.specialtyLabel || 'General'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Chat button */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" />
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />

                  {/* Date / Time row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Date */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <IconsaxCalendarIcon size={16} color="rgba(253,253,253,0.9)" />
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#FDFDFD' }} numberOfLines={1}>
                        {formatDateLabel(upcomingItem.dateKey)}
                      </Text>
                    </View>

                    {/* Vertical divider */}
                    <View style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 12 }} />

                    {/* Time */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <IconsaxTimerIcon size={16} color="rgba(253,253,253,0.9)" />
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#FDFDFD' }}>
                        {upcomingItem.startLabel} - {upcomingItem.endLabel}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ) : (
                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    paddingVertical: 28,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' }}>
                    <IconsaxCalendarIcon size={26} color={BRAND} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#252B37' }}>
                    You're all clear
                  </Text>
                  <Text style={{ fontSize: 13, color: '#717680', textAlign: 'center' }}>
                    No visits scheduled — browse doctors below to book one.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════
            OUR DOCTORS SECTION
        ══════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 20 }}>

          {/* Section header + chips */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: '#000000' }}>Our Doctors</Text>
              <Text style={{ fontSize: 14, fontWeight: '400', color: '#717680' }}>See All</Text>
            </View>

            {/* Role filter chips — horizontal scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}>
              {ROLE_CHIPS.map((chip) => {
                const isActive = roleFilter === chip.value && chip.value !== 'all';
                return (
                  <Pressable
                    key={chip.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setRoleFilter(isActive ? 'all' : chip.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 99999,
                      backgroundColor: isActive ? '#EFF4FF' : '#F5F5F5',
                    }}
                    className="active:opacity-75">
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        lineHeight: 16,
                        color: isActive ? BRAND : '#717680',
                        letterSpacing: -0.24,
                      }}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Doctor grid — 2 columns, 29px gap (Figma exact) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 29 }}>
            {filteredStaff.length === 0 ? (
              <Text
                style={{
                  width: '100%',
                  paddingVertical: 24,
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9095A1',
                }}>
                No providers match your search.
              </Text>
            ) : (
              filteredStaff.map((s) => (
                <View key={s.id} style={{ width: cardWidth }}>
                  <ProviderCard
                    staff={s}
                    availableToday={true}
                    onPress={() => router.push(`/health-service/book/${s.id}`)}
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}