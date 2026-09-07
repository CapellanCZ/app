import { useRouter } from 'expo-router';

import { GetStartedHero } from '@/components/auth/GetStartedHero';
import { useLoginSheetStore } from '@/lib/auth/loginSheetStore';
import { ROUTES } from '@/lib/routes';

export default function GetStarted() {
  const router = useRouter();
  const showLogin = useLoginSheetStore((s) => s.show);

  return (
    <GetStartedHero
      onSignIn={showLogin}
      onTerms={() => router.push(ROUTES.terms)}
      onPrivacy={() => router.push(ROUTES.privacy)}
    />
  );
}
