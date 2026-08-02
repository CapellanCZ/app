import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/lib/notifications/notificationStore';

type HealthStoreGet = () => {
  loadAppointments: () => Promise<void>;
  staff: Array<{ id: string; name: string }>;
};

function removeStaleChannel(client: SupabaseClient, channelName: string) {
  const topic = `realtime:${channelName}`;
  for (const existing of client.getChannels()) {
    if (existing.topic === topic) {
      void client.removeChannel(existing);
    }
  }
}

type RefCountedSubscription = {
  count: number;
  cleanup: (() => void) | null;
};

const appointmentsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
};

function releaseSlot(slot: RefCountedSubscription) {
  slot.count = Math.max(0, slot.count - 1);
  if (slot.count === 0 && slot.cleanup) {
    slot.cleanup();
    slot.cleanup = null;
  }
}

export function acquireAppointmentsSubscription(get: HealthStoreGet): () => void {
  appointmentsSubscription.count += 1;

  if (!appointmentsSubscription.cleanup) {
    if (!supabase) {
      return () => releaseSlot(appointmentsSubscription);
    }

    const client = supabase;
    const channelName = 'appointments_changes';
    removeStaleChannel(client, channelName);

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        async (payload: {
          eventType: string;
          old?: { status?: string };
          new?: { status?: string; doctor_id?: string };
        }) => {
          void get().loadAppointments();
          if (
            payload.eventType === 'UPDATE' &&
            payload.old?.status === 'pending' &&
            payload.new?.status === 'confirmed'
          ) {
            const {
              data: { user },
            } = await client.auth.getUser();
            if (user?.id) {
              const staffName =
                get().staff.find((s) => s.id === payload.new?.doctor_id)?.name ?? 'the provider';
              useNotificationStore.getState().notifySelf(user.id, {
                category: 'health',
                title: 'Appointment Confirmed!',
                body: `Your appointment with ${staffName} has been confirmed. Please arrive 10 minutes early.`,
                href: '/(tabs)/appointments',
                notificationType: 'success',
              });
            }
          }
        },
      )
      .subscribe();

    appointmentsSubscription.cleanup = () => {
      void client.removeChannel(channel);
    };
  }

  return () => releaseSlot(appointmentsSubscription);
}
