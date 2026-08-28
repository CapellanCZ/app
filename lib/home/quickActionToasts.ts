import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { showAppToast } from '@/lib/ui/toastBridge';

/** Friendly heads-up when the home "More" quick action is not available yet. */
export function showMoreQuickActionToast() {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  showAppToast({
    variant: 'accent',
    status: 'info',
    placement: 'top',
    duration: 4500,
    label: 'More features coming soon',
    description:
      'Medical records, prescriptions, and other campus health tools are on the way. We will notify you when they are ready.',
  });
}
