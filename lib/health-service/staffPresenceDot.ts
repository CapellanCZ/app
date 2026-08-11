import type { StaffPresenceStatus } from '@/lib/health-service/healthServiceApi';

/** Three-state avatar indicator used on home / reusable surfaces. */
export type DoctorPresenceDotStatus = 'active' | 'on_break' | 'offline';

export type DoctorPresenceDotMeta = {
  status: DoctorPresenceDotStatus;
  label: string;
  color: string;
  glow: boolean;
};

const DOT_META: Record<DoctorPresenceDotStatus, Omit<DoctorPresenceDotMeta, 'status'>> = {
  active: { label: 'Active', color: '#62D300', glow: true },
  on_break: { label: 'On break', color: '#F5C518', glow: true },
  offline: { label: 'Offline', color: '#D1D2D1', glow: false },
};

/**
 * Map Supabase staff presence → Active / On break / Offline.
 * `cutoff` and `unavailable` both read as Offline in the UI.
 */
export function mapStaffPresenceToDotStatus(
  presence: StaffPresenceStatus,
): DoctorPresenceDotStatus {
  switch (presence) {
    case 'available':
      return 'active';
    case 'on_break':
      return 'on_break';
    case 'cutoff':
    case 'unavailable':
    default:
      return 'offline';
  }
}

/** Reusable color/label metadata for a presence dot. */
export function getDoctorPresenceDotMeta(
  status: DoctorPresenceDotStatus,
): DoctorPresenceDotMeta {
  return { status, ...DOT_META[status] };
}

/** Convenience: staff presence → full tip metadata in one call. */
export function resolveDoctorPresenceDot(
  presence: StaffPresenceStatus,
): DoctorPresenceDotMeta {
  return getDoctorPresenceDotMeta(mapStaffPresenceToDotStatus(presence));
}
