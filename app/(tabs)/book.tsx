import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';

/**
 * Book (+) is not a destination — if this route ever gains focus, return to Home
 * (e.g. after closing the booking stack) without re-opening booking.
 */
export default function BookTab() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.navigate('index');
    }, [navigation]),
  );

  return null;
}
