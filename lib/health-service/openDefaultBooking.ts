import { router } from 'expo-router';

import { getDefaultBookingStaff } from '@/lib/health-service/getDefaultBookingStaff';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { showAppToast } from '@/lib/ui/toastBridge';

/** Opens the booking screen for the default campus provider (full screen, no tabs). */
export async function openDefaultBooking(): Promise<boolean> {
  const store = useHealthServiceStore.getState();
  if (!store.staffLoaded) {
    await store.loadStaff();
  }

  const staff = getDefaultBookingStaff(store.staff);
  if (!staff) {
    showAppToast({
      variant: 'accent',
      placement: 'top',
      duration: 4000,
      label: 'No providers available',
      description: 'Please check back later or contact the campus clinic.',
    });
    return false;
  }

  router.push(`/health-service/book/${staff.id}`);
  return true;
}
