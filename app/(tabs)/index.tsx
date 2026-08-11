import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HomeQuickActions } from '@/components/home/HomeQuickActions';
import { HomeWelcomeHeader } from '@/components/home/HomeWelcomeHeader';
import {
  HomeUpcomingAppointmentCard,
  HomeUpcomingEmptyCard,
} from '@/components/home/HomeUpcomingAppointmentCard';
import { HomeVitalsRow } from '@/components/home/HomeVitalsRow';
import { HealthServiceAnnouncementCard } from '@/components/health-service/HealthServiceAnnouncementCard';
import { HealthServiceScreenShell } from '@/components/health-service/HealthServiceScreenShell';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  staffNameForAppointment,
  useHealthServiceStore,
} from '@/lib/health-service/healthServiceStore';
import { useProfileStore } from '@/lib/profile/profileStore';
import { ROUTES } from '@/lib/routes';
import { Inter } from '@/lib/typography/inter';

function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${d} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
}

function displayFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'there';
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1]?.[0];
  return lastInitial ? `${parts[0]} ${lastInitial}.` : parts[0];
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: Inter.medium,
        fontSize: 22,
        color: '#111111',
        letterSpacing: -1.6,
        lineHeight: 26,
      }}>
      {children}
    </Text>
  );
}

/**
 * Patient home dashboard — Figma CampusCare node 2218:37.
 */
export default function HealthServiceScreen() {
  const insets = useSafeAreaInsets();
  const { patient } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const avatarUrl = profile?.avatar_url ?? null;

  const [refreshing, setRefreshing] = useState(false);

  const { appointments, staff, loadAppointments, loadStaff, refreshData, subscribeAppointments } =
    useHealthServiceStore();
  const loadAnnouncements = useAnnouncementStore((s) => s.load);

  useEffect(() => {
    // Prefetch announcements as soon as Home mounts (overlaps skeleton).
    void loadAnnouncements();
    if (!staff.length) loadStaff();
    if (!appointments.length) loadAppointments();
    return subscribeAppointments();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshData(), loadAnnouncements({ force: true })]);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData, loadAnnouncements]);

  const userName = useMemo(() => {
    const full =
      patient?.full_name?.trim() ||
      profile?.full_name?.trim() ||
      (profile ? `${profile.first_name} ${profile.last_name}`.trim() : '') ||
      '';
    return displayFirstName(full || 'CampusCare user');
  }, [patient?.full_name, profile]);

  const upcomingItem = useMemo(() => {
    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    return (
      appointments
        .filter((a) => a.status === 'confirmed')
        .filter((a) => a.dateKey >= today)
        .sort((a, b) => {
          if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
          return a.startLabel.localeCompare(b.startLabel);
        })[0] ?? null
    );
  }, [appointments]);

  const upcomingStaffName = upcomingItem ? staffNameForAppointment(upcomingItem.staffId) : '';
  const upcomingStaff = upcomingItem ? staff.find((s) => s.id === upcomingItem.staffId) : null;

  const timeLabel = upcomingItem?.startLabel ?? '';

  const estDoneLabel = useMemo(() => {
    if (!upcomingItem) return null;
    if (upcomingItem.endLabel) return upcomingItem.endLabel;

    // Fallback: 20-min slot (matches booking interval) when ends_at is missing.
    const start = upcomingItem.startLabel;
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(start.trim());
    if (!match) return null;
    let hour = Number(match[1]);
    let minute = Number(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    minute += 20;
    if (minute >= 60) {
      minute -= 60;
      hour = (hour + 1) % 24;
    }
    const endPeriod = hour >= 12 ? 'PM' : 'AM';
    const endHour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${endHour12}:${String(minute).padStart(2, '0')} ${endPeriod}`;
  }, [upcomingItem]);

  return (
    <HealthServiceScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 16,
          gap: 20,
          backgroundColor: '#F9F9F9',
        }}>
        {/* Header + greeting */}
        <View style={{ gap: 10 }}>
          <View style={{ paddingVertical: 10 }}>
            <HomeWelcomeHeader userName={userName} avatarUrl={avatarUrl} />
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 30,
                color: '#222222',
                letterSpacing: -2.24,
                lineHeight: 40,
              }}>
              How are you feeling today?
            </Text>
          </View>
        </View>

        {/* Upcoming + quick actions */}
        <View style={{ gap: 16 }}>
          {upcomingItem ? (
            <HomeUpcomingAppointmentCard
              doctorName={upcomingStaffName || upcomingStaff?.name || 'Clinic staff'}
              specialtyLabel={upcomingStaff?.specialtyLabel || 'Campus Clinic'}
              photoUrl={upcomingStaff?.photoUrl}
              dateLabel={formatShortDate(upcomingItem.dateKey)}
              timeLabel={timeLabel}
              estDoneLabel={estDoneLabel}
              onPress={() =>
                router.push({
                  pathname: '/health-service/appointment/[id]',
                  params: { id: upcomingItem.id },
                })
              }
              onCallPress={() => {
                // Clinic contact — wire to real number when available.
              }}
            />
          ) : (
            <HomeUpcomingEmptyCard />
          )}

          <HomeQuickActions
            onBookings={() => router.push(ROUTES.appointments)}
            onVitals={() => router.push(ROUTES.appointments)}
            onMore={() => router.push(ROUTES.profile)}
          />
        </View>

        {/* Vitals */}
        <View style={{ gap: 12 }}>
          <SectionTitle>Your Vitals</SectionTitle>
          <HomeVitalsRow />
        </View>

        {/* Announcements */}
        <View style={{ gap: 12 }}>
          <SectionTitle>Announcement</SectionTitle>
          <HealthServiceAnnouncementCard />
        </View>
      </ScrollView>
    </HealthServiceScreenShell>
  );
}
