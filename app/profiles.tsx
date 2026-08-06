import { Redirect } from 'expo-router';

import { ROUTES } from '@/lib/routes';

/** Legacy `/profiles` path → Profile tab. */
export default function ProfilesRedirect() {
  return <Redirect href={ROUTES.profile} />;
}
