import { useLocalSearchParams } from 'expo-router';

import { HealthServiceBookScreen } from '@/components/booking/HealthServiceBookScreen';

export default function HealthServiceBookScreenRoute() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  return <HealthServiceBookScreen initialStaffId={staffId} />;
}
