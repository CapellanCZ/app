import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function HealthServiceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Health Service' }} />
      <Container>
        <ScreenContent
          path="app/(drawer)/health-service.tsx"
          title="Health Service"
        />
      </Container>
    </>
  );
}
