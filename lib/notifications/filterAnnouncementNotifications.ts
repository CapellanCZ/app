import { patientMatchesAnnouncementAudience } from '@/lib/announcements/announcementAudience';
import type { NotificationRow } from './types';

export function isAnnouncementNotificationRow(row: NotificationRow): boolean {
  if ((row.type ?? '').toLowerCase() === 'announcement') return true;
  const id = row.metadata?.announcement_id;
  return typeof id === 'string' && id.length > 0;
}

function resolveAnnouncementAudience(
  row: NotificationRow,
  audienceByAnnouncementId: ReadonlyMap<string, string>,
): string | null {
  const metaAudience = row.metadata?.announcement_audience;
  if (typeof metaAudience === 'string' && metaAudience.trim()) {
    return metaAudience;
  }

  const announcementId = row.metadata?.announcement_id;
  if (typeof announcementId !== 'string' || !announcementId.trim()) return null;

  return audienceByAnnouncementId.get(announcementId) ?? null;
}

/** Drop announcement inbox rows that do not match the signed-in patient's role. */
export function filterAnnouncementNotificationsForPatient(
  rows: NotificationRow[],
  patientType: string | null | undefined,
  audienceByAnnouncementId: ReadonlyMap<string, string>,
): NotificationRow[] {
  return rows.filter((row) => {
    if (!isAnnouncementNotificationRow(row)) return true;

    const audience = resolveAnnouncementAudience(row, audienceByAnnouncementId);
    if (!audience) return true;

    return patientMatchesAnnouncementAudience(patientType, audience);
  });
}

export function collectAnnouncementIds(rows: NotificationRow[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    if (!isAnnouncementNotificationRow(row)) continue;
    const id = row.metadata?.announcement_id;
    if (typeof id === 'string' && id.trim()) ids.add(id);
  }
  return [...ids];
}
