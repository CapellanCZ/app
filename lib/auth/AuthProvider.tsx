import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { clearStaleSession, isStaleSessionError } from '@/lib/auth/sessionRecovery';
import { consumeIntentionalSignOut } from '@/lib/auth/signOut';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { showAppToast } from '@/lib/ui/toastBridge';
import { useNotificationPreferencesStore } from '@/lib/notifications/notificationPreferencesStore';
import { registerPushToken } from '@/lib/notifications/registerPushToken';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import { useStaffPresenceStore } from '@/lib/health-service/staffPresenceStore';
import { usePatientStore } from '@/lib/patients/patientStore';
import type { EnrollmentStatus, Patient } from '@/lib/patients/types';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';
import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { useNotificationStore } from '@/lib/notifications/notificationStore';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  patient: Patient | null;
  enrollmentStatus: EnrollmentStatus;
  isEnrollmentLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  isConfigured: false,
  patient: null,
  enrollmentStatus: 'unknown',
  isEnrollmentLoading: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hadSessionRef = useRef(false);

  const patient = usePatientStore((s) => s.patient);
  const enrollmentStatus = usePatientStore((s) => s.enrollmentStatus);
  const isEnrollmentLoading = usePatientStore((s) => s.isLoading);
  const fetchPatient = usePatientStore((s) => s.fetchPatient);
  const resetPatient = usePatientStore((s) => s.reset);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    const client = supabase;

    let cancelled = false;

    void (async () => {
      const {
        data: { session: s },
        error,
      } = await client.auth.getSession();

      if (cancelled) return;

      if (error && isStaleSessionError(error)) {
        await clearStaleSession(client);
        setSession(null);
        setIsLoading(false);
        return;
      }

      if (s?.user) {
        hadSessionRef.current = true;
      }

      setSession(s ?? null);
      setIsLoading(false);
    })();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        const wasIntentional = consumeIntentionalSignOut();
        if (hadSessionRef.current && !wasIntentional) {
          showAppToast({
            variant: 'warning',
            label: 'Session expired',
            description: 'Please sign in again.',
          });
        }
        hadSessionRef.current = false;
        setSession(null);
        return;
      }

      if (s?.user) {
        hadSessionRef.current = true;
      }

      setSession(s);
    });

    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  // Resolve patients enrollment whenever session changes.
  useEffect(() => {
    if (!session?.user?.id) {
      if (session === null && !isLoading) {
        resetPatient();
      }
      return;
    }
    void fetchPatient(session.user.id);
  }, [session?.user?.id, isLoading, fetchPatient, resetPatient]);

  // Push token only when enrolled.
  useEffect(() => {
    if (session?.user?.id && enrollmentStatus === 'enrolled') {
      registerPushToken(session.user.id);
    }
  }, [session?.user?.id, enrollmentStatus]);

  const { loadStaff, loadAppointments, reset: resetHealthService } = useHealthServiceStore();
  useEffect(() => {
    if (session?.user?.id && enrollmentStatus === 'enrolled') {
      void (async () => {
        await Promise.all([loadStaff(), loadAppointments()]);
        // Always warm staff presence right after login / session restore.
        await useStaffPresenceStore.getState().loadAllStaff();
      })();
    } else if (session === null && !isLoading) {
      resetHealthService();
      useStaffPresenceStore.getState().reset();
      useVitalsStore.getState().reset();
      useAnnouncementStore.setState({
        items: [],
        hasLoaded: false,
        loading: false,
        lastPatientType: null,
      });
      useNotificationStore.setState({
        items: [],
        unreadCount: 0,
        loading: false,
        error: null,
        hasLoaded: false,
      });
      useNotificationPreferencesStore.getState().reset();
    }
  }, [session?.user?.id, enrollmentStatus, isLoading, loadStaff, loadAppointments, resetHealthService]);

  const { fetchProfile, setFromPatient, reset: resetProfile } = useProfileStore();
  useEffect(() => {
    if (!session?.user?.id || enrollmentStatus !== 'enrolled') {
      if (session === null && !isLoading) {
        resetProfile();
      }
      return;
    }

    if (patient) {
      setFromPatient(patient, session.user.id, {
        userMetadata: session.user.user_metadata,
      });
      return;
    }

    void fetchProfile(session.user.id, {
      email: session.user.email ?? undefined,
      userMetadata: session.user.user_metadata,
    });
  }, [session?.user?.id, enrollmentStatus, patient, fetchProfile, setFromPatient, resetProfile, isLoading]);
  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        patient,
        enrollmentStatus,
        isEnrollmentLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
