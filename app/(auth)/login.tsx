import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useLoginSheetStore } from '@/lib/auth/loginSheetStore';

/**
 * Deep-link / legacy `/login` route — opens the RN Modal sheet over get-started.
 */
export default function LoginRoute() {
  const router = useRouter();
  const show = useLoginSheetStore((s) => s.show);

  useEffect(() => {
    show();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)' as never);
    }
  }, [show, router]);

  return null;
}
