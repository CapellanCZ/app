import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';

import {
  ScholarshipCard,
  ScholarshipSearchBar,
} from '@/components/student-development-affairs';
import { ScreenNavbar } from '@/components/ScreenNavbar';

const MOCK_SCHOLARSHIPS = [
  {
    id: '1',
    title: 'White Scholarship',
    categoryLabel: 'Academic Excellence',
    discountLabel: '50% Discount',
    scheduleLabel: 'every start of academic year',
  },
  {
    id: '2',
    title: 'Gold Scholarship',
    categoryLabel: 'Academic Excellence',
    discountLabel: '50% Discount',
    scheduleLabel: 'every start of academic year',
  },
  {
    id: '3',
    title: 'Gold Scholarship',
    categoryLabel: 'Academic Excellence',
    discountLabel: '50% Discount',
    scheduleLabel: 'every start of academic year',
  },
] as const;

/** Figma 1263:2934 — #FAFAFA chrome, search band, white sheet 30 top radius. */
export default function StudentDevelopmentAffairsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar
        title="Student Development & Activities"
        titleNumberOfLines={2}
        menuIconSize={32}
        onBackPress={() => router.replace('/(drawer)/(tabs)')}
      />
      <View className="mt-2 min-h-0 flex-1 px-0">
        <View className="pt-1 pb-5 px-4">
          <ScholarshipSearchBar value={query} onChangeText={setQuery} onSortPress={() => {}} />
        </View>
        <View className="min-h-0 flex-1 rounded-t-[30px] bg-white pt-6 pb-8">
          <View className="mb-4 px-6">
            <Text className="text-lg leading-6 font-semibold tracking-[0.08px] text-[#1F2024]">
              Academic Scholarships
            </Text>
          </View>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="w-full gap-3 pb-4 px-4">
              {MOCK_SCHOLARSHIPS.map((item) => (
                <ScholarshipCard
                  key={item.id}
                  title={item.title}
                  categoryLabel={item.categoryLabel}
                  discountLabel={item.discountLabel}
                  scheduleLabel={item.scheduleLabel}
                  onApplyPress={() => {}}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
