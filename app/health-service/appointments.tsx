import { Redirect } from 'expo-router';

import { ROUTES } from '@/lib/routes';

/** Legacy health-service path → stack appointments screen. */
export default function HealthServiceAppointmentsRedirect() {
  return <Redirect href={ROUTES.appointments} />;
}
