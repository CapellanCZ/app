import { create } from 'zustand';

import {
  EMPTY_VITALS,
  fetchLatestVitalsForPatient,
  fetchVitalsForAppointment,
  type LatestVitals,
} from '@/lib/vitals/vitalsApi';
import { hasVitalsReadings } from '@/lib/vitals/vitalsDisplay';
import { acquireVitalsSubscription } from '@/lib/vitals/realtimeSubscriptions';

type ConsultationVitalsParams = {
  appointmentId: string;
  studentId?: string | null;
  employeeId?: string | null;
  serviceDate?: string | null;
};

type VitalsState = {
  vitals: LatestVitals;
  consultationByAppointment: Record<string, LatestVitals>;
  /** Bumps when patient_records vitals change (realtime). */
  revision: number;
  hasLoaded: boolean;
  loading: boolean;
  load: (params: {
    studentId?: string | null;
    employeeId?: string | null;
    force?: boolean;
  }) => Promise<LatestVitals>;
  loadConsultationVitals: (params: ConsultationVitalsParams) => Promise<LatestVitals>;
  bumpConsultationRevision: () => void;
  subscribe: () => () => void;
  reset: () => void;
};

/**
 * Clinic vitals — prefetched on splash, kept live via patient_records realtime.
 */
export const useVitalsStore = create<VitalsState>((set, get) => ({
  vitals: EMPTY_VITALS,
  consultationByAppointment: {},
  revision: 0,
  hasLoaded: false,
  loading: false,

  load: async ({ studentId, employeeId, force }) => {
    if (get().loading) return get().vitals;

    const empty = !hasVitalsReadings(get().vitals);
    const canUpgradeEmpty = empty && Boolean(studentId || employeeId);

    if (get().hasLoaded && !force && !canUpgradeEmpty) {
      return get().vitals;
    }

    if (!studentId && !employeeId) {
      set({ vitals: EMPTY_VITALS, hasLoaded: true, loading: false });
      return EMPTY_VITALS;
    }

    set({ loading: true });
    try {
      const vitals = await fetchLatestVitalsForPatient({ studentId, employeeId });
      set({ vitals, hasLoaded: true, loading: false });
      return vitals;
    } catch (e) {
      console.error('[vitals] store load failed:', e);
      set({ hasLoaded: true, loading: false });
      return get().vitals;
    }
  },

  loadConsultationVitals: async (params) => {
    const appointmentId = params.appointmentId.trim();
    if (!appointmentId) return EMPTY_VITALS;

    const vitals = await fetchVitalsForAppointment({
      appointmentId,
      studentId: params.studentId,
      employeeId: params.employeeId,
      serviceDate: params.serviceDate,
    });

    set((state) => ({
      consultationByAppointment: {
        ...state.consultationByAppointment,
        [appointmentId]: vitals,
      },
    }));

    return vitals;
  },

  bumpConsultationRevision: () => {
    set((state) => ({
      revision: state.revision + 1,
      consultationByAppointment: {},
    }));
  },

  subscribe: () => acquireVitalsSubscription(get),

  reset: () =>
    set({
      vitals: EMPTY_VITALS,
      consultationByAppointment: {},
      revision: 0,
      hasLoaded: false,
      loading: false,
    }),
}));
