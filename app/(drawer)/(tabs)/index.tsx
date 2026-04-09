import { useState } from 'react';
import { View } from 'react-native';

import {
  PromoBannerCarousel,
  type PromoBannerItem,
} from '@/components/home/PromoBannerCarousel';
import { SearchBar } from '@/components/SearchBar';
import { TopNavigationBar } from '@/components/home/TopNavigationBar';

const SAMPLE_BANNERS: PromoBannerItem[] = [
  {
    id: '1',
    title: 'Title',
    description:
      'Description. Lorem ipsum dolor sit amet consectetur adipiscing elit, sed do.',
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

  return (
    <View className="mx-4 flex-1 gap-3">
      <TopNavigationBar userName="Nationalian" />

      <SearchBar placeholder="Search" onChangeText={setSearchQuery} value={searchQuery} />

      <PromoBannerCarousel items={SAMPLE_BANNERS} />
    </View>
  );
}
  