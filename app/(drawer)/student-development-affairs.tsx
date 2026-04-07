import { Stack } from 'expo-router';

import { Container } from '@/components/Container';
import { ScreenContent } from '@/components/ScreenContent';

export default function StudentDevelopmentAffairsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Student Development Affairs' }} />
      <Container>
        <ScreenContent
          path="app/(drawer)/student-development-affairs.tsx"
          title="Student Development Affairs"
        />
      </Container>
    </>
  );
}
