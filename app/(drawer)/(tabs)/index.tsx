import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppointmentCardStack,
  type AppointmentCardData,
} from '@/components/home/AppointmentCardStack';
import { PromoBannerCarousel, type PromoBannerItem } from '@/components/home/PromoBannerCarousel';
import { SearchBar } from '@/components/SearchBar';
import { TextLinkButton } from '@/components/TextLinkButton';
import { TopNavigationBar } from '@/components/home/TopNavigationBar';
import { WeeklyCalendar } from '@/components/home/WeeklyCalendar';
import { QuickActionPill } from '@/components/home/QuickActionPill';
import { router } from 'expo-router';

const SAMPLE_APPOINTMENTS: AppointmentCardData[] = [
  {
    id: 'a1',
    title: 'Health Service Office',
    subtitle: 'Document Submission',
    dateLabel: 'Friday, 30 Jan',
    timeRangeLabel: '09:00 - 10:00',
    onCallPress: () => {},
  },
  {
    id: 'a2',
    title: 'Counseling Center',
    subtitle: 'Follow-up session',
    dateLabel: 'Monday, 2 Feb',
    timeRangeLabel: '14:00 - 15:00',
    onCallPress: () => {},
  },
  {
    id: 'a3',
    title: 'Dental Clinic',
    subtitle: 'Annual check-up',
    dateLabel: 'Wednesday, 4 Feb',
    timeRangeLabel: '10:30 - 11:30',
    onCallPress: () => {},
  },
];

const SAMPLE_BANNERS: PromoBannerItem[] = [
  {
    id: '1',
    title: 'Title',
    description: 'Description. Lorem ipsum dolor sit amet consectetur adipiscing elit, sed do.',
    buttonLabel: 'Button',
    onButtonPress: () => {},
  },
  {
    id: '2',
    title: 'CampusCare services',
    description: 'Book counseling, health visits, and campus support in one place.',
    buttonLabel: 'Explore',
    onButtonPress: () => {},
  },
  {
    id: '3',
    title: 'Need help?',
    description: 'Reach student welfare and get answers from your National University team.',
    buttonLabel: 'Get support',
    onButtonPress: () => {},
  },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 12) + 20,
        }}>
        <View className="gap-3">
          <TopNavigationBar userName="Nationalian" />

          <SearchBar placeholder="Search" onChangeText={setSearchQuery} value={searchQuery} />

          <PromoBannerCarousel items={SAMPLE_BANNERS} />

          <View className="mt-2">
            <View className="w-full flex-row items-center justify-between">
              <Text className="text-lg font-semibold">Upcoming Appointments</Text>
              <TextLinkButton
                accessibilityLabel="See all upcoming appointments"
                href="/(drawer)/(tabs)/appointments"
                label="See All"
              />
            </View>
            <View className="mt-1 gap-2">
              <WeeklyCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              <AppointmentCardStack appointments={SAMPLE_APPOINTMENTS} />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold">Quick Actions</Text>
            <View className="mt-2 w-full gap-2.5">
              <View className="w-full flex-row gap-2.5">
                <QuickActionPill
                  className="min-w-0 flex-1 basis-0"
                  icon="calendar"
                  label="Book Appointment"
                  onPress={() => {}}
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
                  className="min-w-0 flex-1 basis-0"
                  icon="medal"
                  label="My Scholarship"
                  onPress={() => {
                    router.push('/student-development-affairs');
                  }}
                />
                <View className="min-w-0 flex-1 basis-0" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
