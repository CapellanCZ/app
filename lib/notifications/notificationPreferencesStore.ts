import { create } from 'zustand';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from './notificationPreferenceKeys';

type PreferenceRow = {
  user_id: string;
  appointments: boolean;
  announcements: boolean;
  health: boolean;
};

function rowToPreferences(row: PreferenceRow): NotificationPreferences {
  return {
    appointments: row.appointments,
    announcements: row.announcements,
    health: row.health,
  };
}

interface NotificationPreferencesState {
  preferences: NotificationPreferences;
  hasLoaded: boolean;
  loading: boolean;
  savingKey: NotificationPreferenceKey | null;
  error: string | null;

  fetch: (userId: string) => Promise<void>;
  setPreference: (userId: string, key: NotificationPreferenceKey, value: boolean) => Promise<void>;
  reset: () => void;
}

/**
 * Ensure a preferences row exists so `send-push` can honor toggles.
 * Missing row → upsert defaults (all on).
 */
async function ensurePreferenceRow(userId: string): Promise<PreferenceRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, appointments, announcements, health')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[preferences] fetch failed:', error.message);
    return null;
  }

  if (data) return data as PreferenceRow;

  const payload: PreferenceRow = {
    user_id: userId,
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  };

  const { data: created, error: upsertError } = await supabase
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id, appointments, announcements, health')
    .maybeSingle();

  if (upsertError) {
    console.warn('[preferences] ensure row failed:', upsertError.message);
    return payload;
  }

  return (created as PreferenceRow | null) ?? payload;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesState>((set, get) => ({
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  hasLoaded: false,
  loading: false,
  savingKey: null,
  error: null,

  fetch: async (userId) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ preferences: DEFAULT_NOTIFICATION_PREFERENCES, hasLoaded: true, loading: false });
      return;
    }

    set({ loading: true, error: null });
    const row = await ensurePreferenceRow(userId);

    set({
      preferences: row ? rowToPreferences(row) : DEFAULT_NOTIFICATION_PREFERENCES,
      loading: false,
      hasLoaded: true,
      error: null,
    });
  },

  setPreference: async (userId, key, value) => {
    const previous = get().preferences[key];
    const next: NotificationPreferences = { ...get().preferences, [key]: value };

    set({ preferences: next, savingKey: key, error: null });

    if (!isSupabaseConfigured || !supabase) {
      set({ savingKey: null });
      return;
    }

    const payload = {
      user_id: userId,
      appointments: next.appointments,
      announcements: next.announcements,
      health: next.health,
    };

    const { error } = await supabase.from('notification_preferences').upsert(payload, {
      onConflict: 'user_id',
    });

    if (error) {
      set({
        preferences: { ...get().preferences, [key]: previous },
        savingKey: null,
        error: error.message,
      });
      return;
    }

    set({ savingKey: null });
  },

  reset: () => {
    set({
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      hasLoaded: false,
      loading: false,
      savingKey: null,
      error: null,
    });
  },
}));
