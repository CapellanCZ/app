import { create } from 'zustand';

import {
  fetchLatestVitalsForPatient,
  type LatestVitals,
} from '@/lib/vitals/vitalsApi';

type VitalsState = {
  vitals: LatestVitals;
  hasLoaded: boolean;
  loading: boolean;
  load: (params: {
    studentId?: string | null;
    employeeId?: string | null;
    force?: boolean;
  }) => Promise<LatestVitals>;
  reset: () => void;
};

const EMPTY: LatestVitals = {
  bloodPressure: null,
  heartRate: null,
  updatedAt: null,
};

/**
 * Latest clinic vitals — prefetched on splash, consumed by Home.
 */
export const useVitalsStore = create<VitalsState>((set, get) => ({
  vitals: EMPTY,
  hasLoaded: false,
  loading: false,

  load: async ({ studentId, employeeId, force }) => {
    if (get().loading) return get().vitals;

    const empty =
      !get().vitals.bloodPressure && !get().vitals.heartRate && !get().vitals.updatedAt;
    const canUpgradeEmpty = empty && Boolean(studentId || employeeId);

    if (get().hasLoaded && !force && !canUpgradeEmpty) {
      return get().vitals;
    }

    if (!studentId && !employeeId) {
      set({ vitals: EMPTY, hasLoaded: true, loading: false });
      return EMPTY;
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

  reset: () => set({ vitals: EMPTY, hasLoaded: false, loading: false }),
}));
