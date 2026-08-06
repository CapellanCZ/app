import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  notifyAppointmentCancelled,
  notifyAppointmentConfirmed,
} from '@/lib/notifications/appointmentNotifications';

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
          old?: { status?: string; patient_id?: string };
          new?: {
            id?: string;
            status?: string;
            doctor_id?: string;
            patient_id?: string;
          };
        }) => {
          if (payload.eventType !== 'UPDATE' || !payload.new?.id) {
            void get().loadAppointments();
            return;
          }

          const nextStatus = (payload.new.status ?? '').toLowerCase();
          const prevFromPayload = (payload.old?.status ?? '').toLowerCase();
          // Snapshot local status BEFORE reload — needed if realtime omits old.status.
          const localPrev = (
            get().appointments.find((a) => a.id === payload.new?.id)?.status ?? ''
          ).toLowerCase();
          const prevStatus = prevFromPayload || localPrev;

          const becameConfirmed =
            nextStatus === 'confirmed' &&
            (prevStatus === 'pending' || prevStatus === '');
          const becameCancelled =
            nextStatus === 'cancelled' &&
            prevStatus !== '' &&
            prevStatus !== 'cancelled';

          void get().loadAppointments();

          if (!becameConfirmed && !becameCancelled) return;

          const {
            data: { user },
          } = await client.auth.getUser();
          if (!user?.id) return;

          const staffName =
            get().staff.find((s) => s.id === payload.new?.doctor_id)?.name ?? undefined;

          if (becameConfirmed) {
            notifyAppointmentConfirmed(user.id, {
              appointmentId: payload.new.id,
              doctorName: staffName,
            });
          }

          if (becameCancelled) {
            notifyAppointmentCancelled(user.id, {
              appointmentId: payload.new.id,
              doctorName: staffName,
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[appointments] realtime subscribed');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[appointments] realtime status:', status);
        }
      });

    appointmentsSubscription.cleanup = () => {
      void client.removeChannel(channel);
    };
  }

  return () => releaseSlot(appointmentsSubscription);
}
