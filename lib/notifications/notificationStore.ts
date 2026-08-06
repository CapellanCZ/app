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

function countUnread(items: NotificationItem[]): number {
  let n = 0;
  for (const item of items) {
    if (!item.read) n += 1;
  }
  return n;
}

interface NotificationState {
  items: NotificationItem[];
  loading: boolean;
  /** True after the first fetch/mock load finishes. */
  hasLoaded: boolean;
  /** Cached unread count — prefer selecting this over filtering `items`. */
  unreadCount: number;
  error: string | null;

  /** Initial fetch (call on screen mount or app launch). */
  fetchAll: (userId: string, opts?: { silent?: boolean }) => Promise<void>;

  /** Mark every notification in a section as read. */
  markAllReadInSection: (section: NotificationSection) => Promise<void>;

  /** Mark every notification as read. */
  markAllRead: () => Promise<void>;

  /** Mark a single notification as read. */
  markRead: (id: string) => Promise<void>;

  /** Remove a notification by ID. */
  archive: (id: string) => Promise<void>;

  /** Remove every notification. */
  archiveAll: () => Promise<void>;

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
    payload: Omit<NotificationItem, 'id' | 'read' | 'timeLabel' | 'section'>,
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  loading: false,
  hasLoaded: false,
  unreadCount: 0,
  error: null,

  fetchAll: async (userId, opts) => {
    if (!isSupabaseConfigured || !supabase) {
      get().loadMock();
      return;
    }
    const silent = opts?.silent ?? get().hasLoaded;
    if (!silent) set({ loading: true, error: null });

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
    const items = rows.filter((r) => isWithinDays(r.created_at, 30)).map(toNotificationItem);
    set({
      items,
      unreadCount: countUnread(items),
      loading: false,
      hasLoaded: true,
      error: null,
    });
  },

  markAllReadInSection: async (section) => {
    const ids = get()
      .items.filter((n) => n.section === section && !n.read)
      .map((n) => n.id);
    if (!ids.length) return;

    const idSet = new Set(ids);
    set((s) => {
      const items = s.items.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n));
      return { items, unreadCount: countUnread(items) };
    });

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

    set((s) => {
      let changed = false;
      const items = s.items.map((n) => {
        if (n.read) return n;
        changed = true;
        return { ...n, read: true };
      });
      if (!changed) return s;
      return { items, unreadCount: 0 };
    });

    if (!isSupabaseConfigured || !supabase) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);
  },

  markRead: async (id) => {
    set((s) => {
      const items = s.items.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n));
      return { items, unreadCount: countUnread(items) };
    });
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  },

  archive: async (id) => {
    set((s) => {
      const items = s.items.filter((n) => n.id !== id);
      return { items, unreadCount: countUnread(items) };
    });
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('notifications').delete().eq('id', id);
  },

  archiveAll: async () => {
    const ids = get().items.map((n) => n.id);
    if (!ids.length) return;

    set({ items: [], unreadCount: 0 });

    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('notifications').delete().in('id', ids);
  },

  subscribe: (userId) =>
    acquireNotificationsSubscription(userId, () => {
      void get().fetchAll(userId, { silent: true });
    }),

  loadMock: () => {
    const items = [...MOCK_NOTIFICATIONS];
    set({
      items,
      unreadCount: countUnread(items),
      loading: false,
      error: null,
      hasLoaded: true,
    });
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
    set((s) => {
      const items = [item, ...s.items];
      return { items, unreadCount: countUnread(items) };
    });
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
      // Realtime subscription (debounced) refreshes the list — no eager fetchAll.
    } else {
      get().pushLocal({ ...payload, title });
    }
  },
}));
