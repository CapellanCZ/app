import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HomeDateStripCalendar } from '@/components/home/HomeDateStripCalendar';
import { HomeHeroCarousel, type HomeHeroSlide } from '@/components/home/HomeHeroCarousel';
import { HomeScreenHeader } from '@/components/home/HomeScreenHeader';
import {
  UpcomingAppointmentsList,
  type UpcomingAppointmentListItem,
} from '@/components/home/UpcomingAppointmentsList';
import { TextLinkButton } from '@/components/TextLinkButton';
import { QuickActionPill } from '@/components/home/QuickActionPill';
import { router } from 'expo-router';

const APPOINTMENTS_ROUTE = '/(drawer)/(tabs)/appointments';

/**
 * Soft screen backdrop: powder blue at the **bottom** → white at the **top**.
 * `colors[0]` sits on `start` (y:1); last color on `end` (y:0).
 */
const HOME_BG_GRADIENT = ['#E8EFFF', '#F4F8FF', '#FFFFFF'] as const;

const HOME_SCROLL_PADDING_H = 20;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfDay(x);
}

function getSundayOfWeek(anchor: Date): Date {
  const s = startOfDay(anchor);
  const dow = s.getDay();
  s.setDate(s.getDate() - dow);
  return s;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function dateKey(d: Date): string {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
}

type ScheduleRow = UpcomingAppointmentListItem & { date: Date };

/** Demo schedules for the current calendar week (Sun–Sat), keyed to “today’s” week. */
function buildWeekDemoSchedules(): ScheduleRow[] {
  const sun = getSundayOfWeek(startOfDay(new Date()));
  const d = (n: number) => addDays(sun, n);
  const go = (): (() => void) => () => router.push(APPOINTMENTS_ROUTE);

  return [
    {
      id: 's1',
      date: d(0),
      timeLabel: '8:20 AM',
      title: 'Morning adviser check',
      subtitle: 'Counselor Lee',
      tone: 'purple',
      onPress: go(),
    },
    {
      id: 'm1',
      date: d(1),
      timeLabel: '10:40 AM',
      title: 'Clinic vitals review',
      subtitle: 'Nurse Ramos',
      tone: 'blue',
      onPress: go(),
    },
    {
      id: 'm2',
      date: d(1),
      timeLabel: '2:15 PM',
      title: 'Vaccination follow-up',
      subtitle: 'Nurse Ramos',
      tone: 'blue',
      onPress: go(),
    },
    {
      id: 'm3',
      date: d(1),
      timeLabel: '4:00 PM',
      title: 'Health clearance',
      subtitle: 'HSO Desk',
      tone: 'orange',
      onPress: go(),
    },
    {
      id: 't1',
      date: d(2),
      timeLabel: '1:30 PM',
      title: 'Restorative conference',
      subtitle: 'Mr. Santos',
      tone: 'orange',
      onPress: go(),
    },
    {
      id: 'w1',
      date: d(3),
      timeLabel: '9:00 AM',
      title: 'Peer mentoring',
      subtitle: 'SDAO',
      tone: 'purple',
      onPress: go(),
    },
    {
      id: 'th1',
      date: d(4),
      timeLabel: '3:10 PM',
      title: 'Guidance follow-up',
      subtitle: 'Counselor Lee',
      tone: 'purple',
      onPress: go(),
    },
    {
      id: 'f1',
      date: d(5),
      timeLabel: '11:00 AM',
      title: 'Scholarship briefing',
      subtitle: 'SDAO',
      tone: 'blue',
      onPress: go(),
    },
  ];
}

const WEEK_DEMO_SCHEDULES: ScheduleRow[] = buildWeekDemoSchedules();

export default function Home() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const appointmentCountForDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of WEEK_DEMO_SCHEDULES) {
      const k = dateKey(row.date);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return (day: Date) => counts.get(dateKey(day)) ?? 0;
  }, []);

  const filteredForSelectedDay = useMemo(
    () => WEEK_DEMO_SCHEDULES.filter((row) => isSameDay(row.date, selectedDate)),
    [selectedDate],
  );

  const listItems: UpcomingAppointmentListItem[] = useMemo(
    () => filteredForSelectedDay.map(({ date: _d, ...rest }) => rest),
    [filteredForSelectedDay],
  );

  const heroSlides = useMemo<HomeHeroSlide[]>(
    () => [
      {
        id: 'hso',
        badge: 'hospital',
        title: 'Need a check-up or health records?',
        description:
            'HSO handles medical care, clearances, and campus health programs when you need them.',
          ctaLabel: "Book Appointment",
        onCtaPress: () => router.push('/health-service'),
      },
      {
        id: 'sdao',
        badge: 'teacher',
        title: 'Scholarships, leadership, and student life?',
        description:
          'SDAO connects you with scholarships, growth opportunities, and campus engagement.',
        ctaLabel: "Apply for a Scholarship",
        onCtaPress: () => router.push('/student-development-affairs'),
      },
      {
        id: 'do',
        badge: 'judge',
        title: 'Report an incident or follow a case?',
        description:
          'DO supports conduct policies, incident reports, and fair resolution on campus.',
        ctaLabel: "File a Case",
        onCtaPress: () => router.push('/discipline-office'),
      },
    ],
    [],
  );

  return (
    <LinearGradient
      colors={[...HOME_BG_GRADIENT]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
        }}>
        <View className="gap-4">
          <HomeScreenHeader title="Home" />

          <HomeHeroCarousel slides={heroSlides} />

          <View>
            <Text className="text-lg font-semibold text-[#1F2024]">Quick Actions</Text>
            <View className="mt-2 w-full gap-2.5">
              <View className="w-full flex-row gap-2.5">
                <QuickActionPill
                  className="min-w-0 flex-1 basis-0"
                  icon="calendar"
                  label="Book Appointment"
                  onPress={() => router.push(APPOINTMENTS_ROUTE)}
                />
                <QuickActionPill
                  className="min-w-0 flex-1 basis-0"
                  icon="tag-user"
                  label="Incident Report"
                  onPress={() => {
                    router.push('/discipline-office/incident-report');
                  }}
                />
              </View>
              <View className="w-full flex-row gap-2.5">
                <QuickActionPill
                  className="min-w-0 flex-2 basis-0"
                  icon="medal"
                  label="My Scholarship"
                  onPress={() => {
                    router.push('/my-scholarship');
                  }}
                />
                <QuickActionPill
                  className="min-w-0 flex-2 basis-0"
                  icon="medal"
                  label="My Scholarship"
                  onPress={() => {
                    router.push('/my-scholarship');
                  }}
                />
                <View className="min-w-0 flex-1 basis-0" />
              </View>
            </View>
          </View>

          <View className="mt-1">
            <View className="w-full flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-[#1F2024]">Upcoming Appointments</Text>
              <TextLinkButton
                accessibilityLabel="See all upcoming appointments"
                href={APPOINTMENTS_ROUTE}
                label="See All"
              />
            </View>

            <View className="mt-2 gap-3">
              <HomeDateStripCalendar
                appointmentCountForDay={appointmentCountForDay}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              <Animated.View key={dateKey(selectedDate)} entering={FadeIn.duration(200)}>
                <UpcomingAppointmentsList items={listItems} />
              </Animated.View>
            </View>
          </View>  
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
