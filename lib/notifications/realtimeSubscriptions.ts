import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { NotificationRow } from '@/lib/notifications/types';

type RefCountedSubscription = {
  count: number;
  cleanup: (() => void) | null;
  userId: string | null;
  /** Always point at the latest handlers — first acquire must not freeze stale closures. */
  handlers: NotificationsRealtimeHandlers | null;
};

const notificationsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
  userId: null,
  handlers: null,
};

function removeStaleChannel(client: SupabaseClient, channelName: string) {
  const topic = `realtime:${channelName}`;
  for (const existing of client.getChannels()) {
    if (existing.topic === topic) {
      void client.removeChannel(existing);
    }
  }
}

function releaseSlot(slot: RefCountedSubscription) {
  slot.count = Math.max(0, slot.count - 1);
  if (slot.count === 0 && slot.cleanup) {
    slot.cleanup();
    slot.cleanup = null;
    slot.userId = null;
    slot.handlers = null;
  }
}

/** Collapse bursty realtime events (e.g. mark-all-read UPDATEs) into one fetch. */
function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, ms);
  };
}

export type NotificationsRealtimeHandlers = {
  onChange: () => void;
  /** Fired for each new notification row (server or client insert). */
  onInsert?: (row: NotificationRow) => void;
  /** Fired when a row is deleted — prefer local removal over refetching the list. */
  onDelete?: (row: NotificationRow) => void;
};

export function acquireNotificationsSubscription(
  userId: string,
  handlers: NotificationsRealtimeHandlers | (() => void),
): () => void {
  // Back-compat: older callers passed a bare onChange function.
  const normalized: NotificationsRealtimeHandlers =
    typeof handlers === 'function' ? { onChange: handlers } : handlers;

  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  if (
    notificationsSubscription.cleanup &&
    notificationsSubscription.userId &&
    notificationsSubscription.userId !== userId
  ) {
    notificationsSubscription.cleanup();
    notificationsSubscription.cleanup = null;
    notificationsSubscription.count = 0;
    notificationsSubscription.handlers = null;
  }

  notificationsSubscription.count += 1;
  notificationsSubscription.userId = userId;
  // Keep latest handlers so toast/onInsert never sticks to a dead acquire.
  notificationsSubscription.handlers = normalized;

  if (!notificationsSubscription.cleanup) {
    const client = supabase;
    const channelName = `notifications:${userId}`;
    removeStaleChannel(client, channelName);

    const debouncedChange = debounce(() => {
      notificationsSubscription.handlers?.onChange();
    }, 350);

    const channel = client
      .channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow | undefined;
          if (row?.id) {
            notificationsSubscription.handlers?.onInsert?.(row);
          }
          debouncedChange();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => debouncedChange(),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.old as NotificationRow | undefined;
          if (row?.id) {
            notificationsSubscription.handlers?.onDelete?.(row);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[notifications] realtime subscribed');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[notifications] realtime status:', status);
        }
      });

    notificationsSubscription.cleanup = () => {
      void client.removeChannel(channel);
    };
  }

  return () => releaseSlot(notificationsSubscription);
}
