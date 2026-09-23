/** Shared appointments filter helpers (UI stays in components/). */

export type AppointmentRangePreset = 'all' | '7' | '30' | '90' | 'custom';

export type AppointmentStatusFilter = 'upcoming' | 'completed';

export const RANGE_PRESETS: { id: AppointmentRangePreset; label: string }[] = [
  { id: 'all', label: 'All Records' },
  { id: '7', label: 'Last 7 Days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Display as MM/DD/YYYY (matches design). */
export function formatDisplayDate(key: string): string {
  const [y, m, d] = key.split('-');
  if (!y || !m || !d) return key;
  return `${m}/${d}/${y}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function rangeFromPreset(preset: AppointmentRangePreset): {
  fromKey: string;
  toKey: string;
} | null {
  if (preset === 'all' || preset === 'custom') return null;
  const days = preset === '7' ? 7 : preset === '30' ? 30 : 90;
  const to = startOfDay(new Date());
  const from = addDays(to, -(days - 1));
  return { fromKey: toDateKey(from), toKey: toDateKey(to) };
}

export function matchesStatusFilter(
  status: string,
  filter: AppointmentStatusFilter,
): boolean {
  if (filter === 'upcoming') return status === 'pending' || status === 'confirmed';
  return status === 'completed';
}
