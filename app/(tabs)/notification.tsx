import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function NotificationScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: 'Notification' }} />
      <Container>
        <ScreenContent
          path="app/(tabs)/notification.tsx"
          title="Notification"
        />
      </Container>
    </>
  );
}
