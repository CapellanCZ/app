import { Redirect } from 'expo-router';

/** `/(tabs)` without a home hub — send to Health Service. */
export default function TabsIndexRedirect() {
  return <Redirect href="/health-service" />;
}
