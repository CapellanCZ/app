import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { registerPushToken } from '@/lib/notifications/registerPushToken';
import { useDisciplineOfficeStore } from '@/lib/discipline-office/disciplineOfficeStore';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';

/** Extract tokens from a Supabase magic-link redirect URL.
 *  Supabase can return tokens in the hash fragment (#access_token=...)
 *  or as query params (?access_token=...) depending on the flow.
 */
function extractTokensFromUrl(url: string) {
  // Try hash fragment first (implicit flow)
  const hash = url.split('#')[1];
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) return { access_token, refresh_token };
  }

  // Fall back to query params (PKCE flow)
  const queryStart = url.indexOf('?');
  if (queryStart !== -1) {
    const query = url.slice(queryStart + 1).split('#')[0]; // strip any trailing hash
    const params = new URLSearchParams(query);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) return { access_token, refresh_token };
  }

  return null;
}

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  isConfigured: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsLoading(false);
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    // Auto-refresh token when app comes to foreground
    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase!.auth.startAutoRefresh();
      } else {
        supabase!.auth.stopAutoRefresh();
      }
    });

    // Handle incoming deep-link URLs (magic link callback)
    const handleUrl = async (event: { url: string }) => {
      const tokens = extractTokensFromUrl(event.url);
      if (tokens) {
        await supabase!.auth.setSession(tokens);
      }
    };

    // Check if the app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    // Listen for links while the app is open
    const linkSub = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.unsubscribe();
      appStateListener.remove();
      linkSub.remove();
    };
  }, []);

  // Register Expo push token with Supabase whenever we have a session.
  useEffect(() => {
    if (session?.user?.id) {
      registerPushToken(session.user.id);
    }
  }, [session?.user?.id]);

  // Pre-fetch scholarship data right after login so detail screen opens instantly.
  const { fetchPrograms, fetchMyApplications, fetchMyEnrollment, reset: resetScholarships } = useScholarshipStore();
  useEffect(() => {
    if (session?.user?.id) {
      fetchPrograms();
      fetchMyApplications();
      fetchMyEnrollment();
    } else if (session === null && !isLoading) {
      resetScholarships();
    }
  }, [session?.user?.id]);

  // Pre-fetch clinic (health service) data right after login so screens open instantly.
  const { loadStaff, loadAppointments, reset: resetHealthService } = useHealthServiceStore();
  useEffect(() => {
    if (session?.user?.id) {
      loadStaff();
      loadAppointments();
    } else if (session === null && !isLoading) {
      resetHealthService();
    }
  }, [session?.user?.id]);

<<<<<<< HEAD
  // Pre-fetch student profile (avatar) and discipline hub stats after login.
  const { fetchProfile, reset: resetProfile } = useProfileStore();
  const { refreshHub, reset: resetDisciplineOffice } = useDisciplineOfficeStore();
  useEffect(() => {
    if (!session?.user?.id) {
      if (session === null && !isLoading) {
        resetProfile();
        resetDisciplineOffice();
      }
      return;
    }

    const userId = session.user.id;
    const metaStudentId = session.user.user_metadata?.student_id as string | undefined;

    // Fire profile fetch; once resolved use the DB student_id (most reliable).
    // In parallel, kick off discipline hub with metadata student_id immediately
    // so counters appear even before the profile query finishes.
    if (metaStudentId) {
      void refreshHub(metaStudentId);
    }

    void fetchProfile(userId, {
      email: session.user.email ?? undefined,
      userMetadata: session.user.user_metadata,
    }).then((profile) => {
      const studentId = profile?.student_id ?? metaStudentId ?? '';
      if (studentId) void refreshHub(studentId);
    });
  }, [session?.user?.id]);

=======
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
