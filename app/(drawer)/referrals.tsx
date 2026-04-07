import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function ReferralsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Referrals' }} />
      <Container>
        <ScreenContent path="app/(drawer)/referrals.tsx" title="Referrals" />
      </Container>
    </>
  );
}
