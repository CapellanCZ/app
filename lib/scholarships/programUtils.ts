import type { ScholarshipCardStatus } from '@/components/student-development-affairs/ScholarshipCard';
import type { ScholarshipProgram } from './types';

export type ScholarshipChipFilter = ScholarshipCardStatus;
export type ScholarshipListFilter = ScholarshipChipFilter | 'all';

export function getScholarshipCardStatus(program: ScholarshipProgram): ScholarshipCardStatus {
  const slotsLeft = program.totalSlots - program.filledSlots;
  const daysLeft = Math.ceil(
    (new Date(program.applicationCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (slotsLeft <= 5) return 'high_demand';
  if (slotsLeft <= 10) return 'limited_slots';
  if (daysLeft <= 7) return 'closing_soon';
  return 'open';
}

export function programMatchesChipFilter(
  program: ScholarshipProgram,
  filter: ScholarshipChipFilter,
): boolean {
  return getScholarshipCardStatus(program) === filter;
}

/** Includes `all` so the See All screen can show a matching selected chip when no status filter applies. */
export const SCHOLARSHIP_CHIP_FILTERS: { key: ScholarshipListFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high_demand', label: 'High Demand' },
  { key: 'limited_slots', label: 'Limited Slots' },
  { key: 'closing_soon', label: 'Closing Soon' },
];
