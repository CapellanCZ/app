import { Redirect } from 'expo-router';

/** Home lives under NativeTabs at `/(tabs)`. */
export default function HealthServiceIndexRedirect() {
  return <Redirect href="/(tabs)" />;
}
