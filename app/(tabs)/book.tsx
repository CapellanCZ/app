import { useCallback } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { openDefaultBooking } from '@/lib/health-service/openDefaultBooking';
import { ROUTES } from '@/lib/routes';

/**
 * Book (+) tab — opens full-screen booking, then returns tab selection to Home
 * so backing out of booking does not re-trigger this screen (iOS NativeTabs).
 */
export default function BookTab() {
  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const opened = await openDefaultBooking();
        if (opened) {
          router.navigate(ROUTES.home);
        }
      })();
    }, []),
  );

  return <View style={{ flex: 1, backgroundColor: '#F9F9F9' }} />;
}
