import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ReferralCard } from '@/components/referrals/ReferralCard';
import { ScreenNavbar } from '@/components/layout/ScreenNavbar';
import { MOCK_REFERRALS } from '@/lib/referrals/mockReferrals';
import { HOME_BG_GRADIENT_COLORS, HOME_BG_GRADIENT_LOCATIONS, HOME_SCROLL_PADDING_H } from '@/lib/ui/screenGradients';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

const T = SCHEDULE_PARTNER;

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...HOME_BG_GRADIENT_COLORS]}
      locations={[...HOME_BG_GRADIENT_LOCATIONS]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
      <ScreenNavbar title="Referrals" />
      <ScrollView
        className="flex-1 bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          gap: 12,
        }}>
        {MOCK_REFERRALS.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
