import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type RefCountedSubscription = {
  count: number;
  cleanup: (() => void) | null;
  userId: string | null;
};

const notificationsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
  userId: null,
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
  }
}

export function acquireNotificationsSubscription(
  userId: string,
  onChange: () => void,
): () => void {
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
  }

  notificationsSubscription.count += 1;
  notificationsSubscription.userId = userId;

  if (!notificationsSubscription.cleanup) {
    const client = supabase;
    const channelName = `notifications:${userId}`;
    removeStaleChannel(client, channelName);

    const channel = client
      .channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => onChange(),
      )
      .subscribe();

    const pollInterval = setInterval(() => onChange(), 30_000);

    notificationsSubscription.cleanup = () => {
      clearInterval(pollInterval);
      void client.removeChannel(channel);
    };
  }

  return () => releaseSlot(notificationsSubscription);
}
