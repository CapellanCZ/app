import { create } from 'zustand';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { acquireNotificationsSubscription } from './realtimeSubscriptions';
import { MOCK_NOTIFICATIONS } from './mockNotifications';
import {
  toNotificationItem,
  isWithinDays,
  mapCategoryToDbType,
  toTitleCase,
  type NotificationItem,
  type NotificationRow,
  type NotificationSection,
} from './types';
import { showAppToast } from '@/lib/ui/toastBridge';

interface NotificationState {
  items: NotificationItem[];
  loading: boolean;
  /** True after the first fetch/mock load finishes. */
  hasLoaded: boolean;
  error: string | null;

  /** Number of unread notifications. */
  unreadCount: () => number;

  /** Initial fetch (call on screen mount or app launch). */
  fetchAll: (userId: string) => Promise<void>;

  /** Mark every notification in a section as read. */
  markAllReadInSection: (section: NotificationSection) => Promise<void>;

  /** Mark every notification as read. */
  markAllRead: () => Promise<void>;

  /** Mark a single notification as read. */
  markRead: (id: string) => Promise<void>;

  /** Remove a notification by ID. */
  archive: (id: string) => Promise<void>;

  /** Subscribe to realtime changes for this user. Returns unsubscribe fn. */
  subscribe: (userId: string) => () => void;

  /** Dev-only: seed the store with mock data when Supabase isn't configured. */
  loadMock: () => void;

  /**
   * Push a notification directly into the local store (no Supabase).
   * Auto-fills id, read, timeLabel, section.
   */
  pushLocal: (payload: Omit<NotificationItem, 'id' | 'read' | 'timeLabel' | 'section'>) => void;

  /**
   * Send a self-notification after an in-app action.
   * - Supabase configured: inserts a DB row (realtime/polling will reflect it).
   * - Not configured: falls back to pushLocal.
   */
  notifySelf: (
    userId: string | undefined,
    payload: Omit<NotificationItem, 'id' | 'read' | 'timeLabel' | 'section'>
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  loading: false,
  hasLoaded: false,
  error: null,

  unreadCount: () => get().items.filter((n) => !n.read).length,

  fetchAll: async (userId) => {
    if (!isSupabaseConfigured || !supabase) {
      get().loadMock();
      return;
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      set({ loading: false, error: error.message, hasLoaded: true });
      return;
    }
    const rows = (data ?? []) as NotificationRow[];
    const within30 = rows.filter((r) => isWithinDays(r.created_at, 30));
    set({
      items: within30.map(toNotificationItem),
      loading: false,
      hasLoaded: true,
    });
  },

  markAllReadInSection: async (section) => {
    const ids = get()
      .items.filter((n) => n.section === section && !n.read)
      .map((n) => n.id);
    if (!ids.length) return;

    // Optimistic
    set((s) => ({
      items: s.items.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    }));

    if (!isSupabaseConfigured || !supabase) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);
  },

  markAllRead: async () => {
    const ids = get()
      .items.filter((n) => !n.read)
      .map((n) => n.id);
    if (!ids.length) return;

    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
    }));

    if (!isSupabaseConfigured || !supabase) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);
  },

  markRead: async (id) => {
    // Optimistic
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  },

  archive: async (id) => {
    // Optimistic
    set((s) => ({ items: s.items.filter((n) => n.id !== id) }));
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('notifications').delete().eq('id', id);
  },

  subscribe: (userId) =>
    acquireNotificationsSubscription(userId, () => {
      void get().fetchAll(userId);
    }),

  loadMock: () => {
    set({ items: [...MOCK_NOTIFICATIONS], loading: false, error: null, hasLoaded: true });
  },

  pushLocal: (payload) => {
    const item: NotificationItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
      title: toTitleCase(payload.title),
      read: false,
      timeLabel: 'Just now',
      section: 'today',
    };
    set((s) => ({ items: [item, ...s.items] }));
  },

  notifySelf: async (userId, payload) => {
    const title = toTitleCase(payload.title);
    const toastVariant =
      payload.notificationType === 'success'
        ? 'success'
        : payload.notificationType === 'error'
          ? 'danger'
          : payload.notificationType === 'warning'
            ? 'warning'
            : 'accent';

    showAppToast({
      variant: toastVariant,
      placement: 'top',
      duration: 5000,
      label: title,
      description: payload.body,
    });

    if (isSupabaseConfigured && supabase && userId) {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: mapCategoryToDbType(payload.category),
        title,
        body: payload.body,
        href: payload.href ?? null,
        read_at: null,
        metadata: {
          category: payload.category,
          notification_type: payload.notificationType ?? 'info',
          source: payload.source ?? null,
        },
      });
      if (error) {
        console.warn('[notifications] notifySelf insert failed:', error.message);
        get().pushLocal({ ...payload, title });
        return;
      }
      get().fetchAll(userId);
    } else {
      get().pushLocal({ ...payload, title });
    }
  },
}));
