import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function removeStaleChannel(client: SupabaseClient, channelName: string) {
  const topic = `realtime:${channelName}`;
  for (const existing of client.getChannels()) {
    if (existing.topic === topic) {
      void client.removeChannel(existing);
    }
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

/**
 * Live updates when clinic/staff break toggles change.
 * Presence is recomputed client-side via `getStaffPresence` on each event.
 */
export function subscribeStaffPresenceChanges(onChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channelName = 'staff_presence_breaks';
  removeStaleChannel(client, channelName);

  const debounced = debounce(onChange, 250);
  let channel: RealtimeChannel | null = null;

  channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_break_status' },
      () => debounced(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clinic_break_status' },
      () => debounced(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'doctor_availability' },
      () => debounced(),
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[staff-presence] realtime subscribed');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[staff-presence] realtime status:', status);
      }
    });

  return () => {
    if (channel) {
      void client.removeChannel(channel);
      channel = null;
    }
  };
}
