import type { SupabaseClient } from '@supabase/supabase-js';

import { shouldRefreshAnnouncementsForAudience } from '@/lib/announcements/announcementAudience';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type RefCountedSubscription = {
  count: number;
  cleanup: (() => void) | null;
  onChange: (() => void) | null;
};

const announcementsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
  onChange: null,
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
    slot.onChange = null;
  }
}

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

/** Subscribe to published announcement changes (home carousel refresh). */
export function acquireAnnouncementsSubscription(onChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  announcementsSubscription.count += 1;
  announcementsSubscription.onChange = onChange;

  if (!announcementsSubscription.cleanup) {
    const client = supabase;
    const channelName = 'announcements:published';
    removeStaleChannel(client, channelName);

    const debouncedChange = debounce(() => {
      announcementsSubscription.onChange?.();
    }, 400);

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          const row = payload.new as { status?: string; audience?: string } | undefined;
          if (row?.status === 'published' && shouldRefreshAnnouncementsForAudience(row.audience)) {
            debouncedChange();
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'announcements' },
        (payload) => {
          const row = payload.new as { status?: string; audience?: string } | undefined;
          if (row?.status === 'published' && shouldRefreshAnnouncementsForAudience(row.audience)) {
            debouncedChange();
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[announcements] realtime subscribed');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[announcements] realtime status:', status);
        }
      });

    announcementsSubscription.cleanup = () => {
      void client.removeChannel(channel);
    };
  }

  return () => releaseSlot(announcementsSubscription);
}
