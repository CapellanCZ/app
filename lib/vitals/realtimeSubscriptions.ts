import type { SupabaseClient } from '@supabase/supabase-js';

import { usePatientStore } from '@/lib/patients/patientStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type VitalsStoreGet = () => {
  load: (params: {
    studentId?: string | null;
    employeeId?: string | null;
    force?: boolean;
  }) => Promise<unknown>;
  bumpConsultationRevision: () => void;
};

type RefCountedSubscription = {
  count: number;
  cleanup: (() => void) | null;
};

const vitalsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
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

function rowMatchesPatient(row: {
  student_id?: string | null;
  employee_id?: string | null;
}): boolean {
  const patient = usePatientStore.getState().patient;
  if (!patient) return false;
  if (patient.student_id?.trim() && row.student_id === patient.student_id) return true;
  if (patient.employee_id?.trim() && row.employee_id === patient.employee_id) return true;
  return false;
}

/** Subscribe to clinic vitals updates in `patient_records`. */
export function acquireVitalsSubscription(get: VitalsStoreGet): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  vitalsSubscription.count += 1;

  if (!vitalsSubscription.cleanup) {
    const client = supabase;
    const channelName = 'patient_records:vitals';
    removeStaleChannel(client, channelName);

    const debouncedRefresh = debounce(() => {
      const patient = usePatientStore.getState().patient;
      if (!patient?.student_id && !patient?.employee_id) return;

      void get()
        .load({
          studentId: patient.student_id,
          employeeId: patient.employee_id,
          force: true,
        })
        .finally(() => {
          get().bumpConsultationRevision();
        });
    }, 400);

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'patient_records' },
        (payload) => {
          const row = payload.new as {
            student_id?: string | null;
            employee_id?: string | null;
            physical_exam?: unknown;
          };
          if (!row.physical_exam || !rowMatchesPatient(row)) return;
          debouncedRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'patient_records' },
        (payload) => {
          const row = payload.new as {
            student_id?: string | null;
            employee_id?: string | null;
            physical_exam?: unknown;
          };
          if (!row.physical_exam || !rowMatchesPatient(row)) return;
          debouncedRefresh();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[vitals] realtime subscribed');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[vitals] realtime status:', status);
        }
      });

    vitalsSubscription.cleanup = () => {
      void client.removeChannel(channel);
    };
  }

  return () => releaseSlot(vitalsSubscription);
}
