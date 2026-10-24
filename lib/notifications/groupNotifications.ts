import type { NotificationItem, NotificationSection } from '@/lib/notifications/types';

export type NotificationListSection = {
  key: NotificationSection;
  title: string;
  data: NotificationItem[];
};

const SECTION_ORDER: NotificationSection[] = ['today', 'yesterday', 'last7', 'last30'];

const SECTION_TITLE: Record<NotificationSection, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  last30: 'Earlier',
};

/** Infer section from relative time labels used by mock / legacy rows. */
export function inferNotificationSection(item: NotificationItem): NotificationSection {
  if (item.section) return item.section;
  const label = item.timeLabel.toLowerCase();
  if (
    label.includes('just now') ||
    label.includes('min') ||
    label.endsWith('h ago') ||
    label.endsWith('m ago')
  ) {
    return 'today';
  }
  if (label === 'yesterday') return 'yesterday';
  if (label.includes('day') || label.includes('week')) return 'last7';
  return 'last30';
}

/** Group filtered notifications into date sections for the inbox list. */
export function groupNotificationsBySection(
  items: NotificationItem[],
): NotificationListSection[] {
  const buckets: Record<NotificationSection, NotificationItem[]> = {
    today: [],
    yesterday: [],
    last7: [],
    last30: [],
  };

  for (const item of items) {
    buckets[inferNotificationSection(item)].push(item);
  }

  return SECTION_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
    key,
    title: SECTION_TITLE[key],
    data: buckets[key],
  }));
}
