import { create } from 'zustand';

import { healthServiceApi } from '@/lib/health-service/healthServiceApi';
import { useHealthServiceStore } from '@/lib/health-service/healthServiceStore';
import {
  mapStaffPresenceToDotStatus,
  type DoctorPresenceDotStatus,
} from '@/lib/health-service/staffPresenceDot';

type PresenceState = {
  /** staffId → latest known presence (boot + home + book). */
  byStaffId: Record<string, DoctorPresenceDotStatus>;
  loadOne: (staffId: string) => Promise<DoctorPresenceDotStatus>;
  /** Prefetch presence for many staff ids in parallel. */
  loadMany: (staffIds: string[]) => Promise<void>;
  /** Prefetch presence for every loaded staff member. */
  loadAllStaff: () => Promise<void>;
  reset: () => void;
};

/**
 * Staff presence cache — warmed after login / splash for all clinic staff.
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

  loadMany: async (staffIds) => {
    const unique = [...new Set(staffIds.filter(Boolean))];
    if (!unique.length) return;
    await Promise.all(unique.map((id) => get().loadOne(id)));
  },

  loadAllStaff: async () => {
    const staff = useHealthServiceStore.getState().staff;
    await get().loadMany(staff.map((s) => s.id));
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
