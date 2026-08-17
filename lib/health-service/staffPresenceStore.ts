import { create } from 'zustand';

import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import {
  mapStaffPresenceToDotStatus,
  type DoctorPresenceDotStatus,
} from '@/lib/health-service/staffPresenceDot';

type PresenceState = {
  /** staffId → latest known presence (boot + home). */
  byStaffId: Record<string, DoctorPresenceDotStatus>;
  loadOne: (staffId: string) => Promise<DoctorPresenceDotStatus>;
  reset: () => void;
};

/**
 * Staff presence cache — warmed during splash for the upcoming appointment doctor.
 */
export const useStaffPresenceStore = create<PresenceState>((set, get) => ({
  byStaffId: {},

  loadOne: async (staffId) => {
    try {
      const presence = await healthServiceApi.getStaffPresence(staffId, new Date());
      const status = mapStaffPresenceToDotStatus(presence);
      set((s) => ({ byStaffId: { ...s.byStaffId, [staffId]: status } }));
      return status;
    } catch (e) {
      console.error('[presence] load failed:', e);
      const status: DoctorPresenceDotStatus = 'offline';
      set((s) => ({ byStaffId: { ...s.byStaffId, [staffId]: status } }));
      return status;
    }
  },

  reset: () => set({ byStaffId: {} }),
}));

export function pickUpcomingConfirmedStaffId(
  appointments: { status: string; dateKey: string; staffId: string; startLabel: string }[],
): string | null {
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const upcoming =
    appointments
      .filter((a) => a.status === 'confirmed')
      .filter((a) => a.dateKey >= today)
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
        return a.startLabel.localeCompare(b.startLabel);
      })[0] ?? null;

  return upcoming?.staffId ?? null;
}
