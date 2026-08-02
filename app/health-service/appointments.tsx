import { Redirect } from 'expo-router';

/** Appointments list lives under NativeTabs at `/(tabs)/appointments`. */
export default function HealthServiceAppointmentsRedirect() {
  return <Redirect href="/(tabs)/appointments" />;
}
