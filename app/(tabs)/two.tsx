import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function ProfileTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: 'Profile' }} />
      <Container>
        <ScreenContent path="app/(tabs)/two.tsx" title="Profile" />
      </Container>
    </>
  );
}
