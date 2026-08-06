import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { ROUTES } from '@/lib/routes';

/**
 * Right-side Book (+) tab. Opens booking, then returns focus to Home.
 */
export default function BookTab() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      router.push(ROUTES.healthServiceDoctors);
      router.navigate(ROUTES.home);
    }, [router]),
  );

  return <View style={{ flex: 1 }} />;
}
