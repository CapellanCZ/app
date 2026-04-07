import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function NotificationScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Notification' }} />
      <Container>
        <ScreenContent
          path="app/(drawer)/(tabs)/notification.tsx"
          title="Notification"
        />
      </Container>
    </>
  );
}
