import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  notifyAppointmentCancelled,
  notifyAppointmentConfirmed,
} from '@/lib/notifications/appointmentNotifications';
import { openVisitCompletedScreen } from '@/lib/health-service/visitCompletedNavigation';
import type { Appointment, Staff } from '@/lib/health-service/types';

type HealthStoreGet = () => {
  loadAppointments: () => Promise<void>;
  appointments: Appointment[];
  staff: Staff[];
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

          const appointmentId = payload.new.id;
          const nextStatus = (payload.new.status ?? '').toLowerCase();
          const prevFromPayload = (payload.old?.status ?? '').toLowerCase();
          // Snapshot local status BEFORE reload — needed if realtime omits old.status.
          const localPrev = (
            get().appointments.find((a) => a.id === appointmentId)?.status ?? ''
          ).toLowerCase();
          const prevStatus = prevFromPayload || localPrev;

          const becameConfirmed =
            nextStatus === 'confirmed' &&
            (prevStatus === 'pending' || prevStatus === '');
          const becameCancelled =
            nextStatus === 'cancelled' &&
            prevStatus !== '' &&
            prevStatus !== 'cancelled';
          const becameCompleted =
            nextStatus === 'completed' &&
            prevStatus !== '' &&
            prevStatus !== 'completed';

          await get().loadAppointments();

          if (!becameConfirmed && !becameCancelled && !becameCompleted) return;

          const {
            data: { user },
          } = await client.auth.getUser();
          if (!user?.id) return;

          const staffMember =
            get().staff.find((s) => s.id === payload.new?.doctor_id) ?? null;
          const staffName = staffMember?.name;

          if (becameConfirmed) {
            notifyAppointmentConfirmed(user.id, {
              appointmentId,
              doctorName: staffName,
            });
          }

          if (becameCancelled) {
            notifyAppointmentCancelled(user.id, {
              appointmentId,
              doctorName: staffName,
            });
          }

          if (becameCompleted) {
            // Only open if this appointment is in the patient's loaded list (owns it).
            const appointment = get().appointments.find((a) => a.id === appointmentId);
            if (appointment?.status === 'completed') {
              openVisitCompletedScreen(appointment, staffMember);
            }
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
