import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function DisciplineOfficeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Discipline Office' }} />
      <Container>
        <ScreenContent
          path="app/(drawer)/discipline-office.tsx"
          title="Discipline Office"
        />
      </Container>
    </>
  );
}
