import { useState, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ReferralCard } from '@/components/referrals/ReferralCard';
import { ReferralsScreenHeader } from '@/components/referrals/ReferralsScreenHeader';
import { type FilterOption } from '@/components/referrals/ReferralFilterButtons';
import { MOCK_REFERRALS } from '@/lib/referrals/mockReferrals';
import { HOME_BG_GRADIENT_COLORS, HOME_BG_GRADIENT_LOCATIONS, HOME_SCROLL_PADDING_H } from '@/lib/ui/screenGradients';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

const T = SCHEDULE_PARTNER;

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');

  // Calculate filter counts
  const filterOptions: FilterOption[] = useMemo(() => {
    const allCount = MOCK_REFERRALS.length;
    const pendingCount = MOCK_REFERRALS.filter(r => r.status === 'pending').length;
    const scheduledCount = MOCK_REFERRALS.filter(r => r.status === 'scheduled').length;
    const completedCount = MOCK_REFERRALS.filter(r => r.status === 'completed').length;

    return [
      { key: 'all', label: 'All', count: allCount },
      { key: 'pending', label: 'Pending', count: pendingCount },
      { key: 'scheduled', label: 'Scheduled', count: scheduledCount },
      { key: 'completed', label: 'Completed', count: completedCount },
    ];
  }, []);

  // Filter referrals based on active filter
  const filteredReferrals = useMemo(() => {
    if (activeFilter === 'all') return MOCK_REFERRALS;
    return MOCK_REFERRALS.filter(referral => referral.status === activeFilter);
  }, [activeFilter]);

  return (
    <LinearGradient
      colors={[...HOME_BG_GRADIENT_COLORS]}
      locations={[...HOME_BG_GRADIENT_LOCATIONS]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
        
      <ReferralsScreenHeader
        filters={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      <ScrollView
        className="flex-1 bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          gap: 12,
        }}>
        {filteredReferrals.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
