import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  AppointmentCardStack,
  type AppointmentCardData,
} from '@/components/home/AppointmentCardStack';
import { PromoBannerCarousel, type PromoBannerItem } from '@/components/home/PromoBannerCarousel';
import { SearchBar } from '@/components/SearchBar';
import { TopNavigationBar } from '@/components/home/TopNavigationBar';
import { WeeklyCalendar } from '@/components/home/WeeklyCalendar';
import { XStack } from 'tamagui';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return (
    <View className="mx-5 flex-1 gap-3">
      <TopNavigationBar userName="Nationalian" />

      <SearchBar placeholder="Search" onChangeText={setSearchQuery} value={searchQuery} />

      <PromoBannerCarousel items={SAMPLE_BANNERS} />

      <View>
        <XStack justifyContent="space-between">
          <Text className="text-lg font-semibold">Upcoming Appointments</Text>
          <Text className="text-sm font-normal text-[#006FFD]">See All</Text>
        </XStack>
        <View className="gap-2 mt-1">
          <WeeklyCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <AppointmentCardStack appointments={SAMPLE_APPOINTMENTS} />
        </View>
      </View>
    </View>
  );
}
