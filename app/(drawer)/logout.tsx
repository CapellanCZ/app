import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { supabase } from '@/utils/supabase';

/** Fallback when opened by URL; drawer tap uses `drawerItemPress` in `(drawer)/_layout`. */
export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      await supabase?.auth.signOut();
      router.replace('/login');
    })();
  }, [router]);

  return <Stack.Screen options={{ title: 'Logout' }} />;
}
