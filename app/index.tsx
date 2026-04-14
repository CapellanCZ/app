import { Redirect } from 'expo-router';

/** Entry `/` → main tab shell. */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
