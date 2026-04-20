import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ReferralCard } from '@/components/referrals/ReferralCard';
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 12) + 24,
          gap: 12,
        }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: T.textPrimary, marginBottom: 4 }}>
          Referrals
        </Text>
        {MOCK_REFERRALS.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
