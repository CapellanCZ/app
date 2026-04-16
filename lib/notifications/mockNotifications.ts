/**
 * Demo notifications — replace with API / Supabase when wired.
 * Each item maps to a welfare area so the hub can filter and deep-link.
 */

export type WelfareNotificationCategory =
  | 'health'
  | 'discipline'
  | 'scholarships'
  | 'referrals'
  | 'campus';

export type NotificationSection = 'today' | 'yesterday' | 'earlier';

export type NotificationItem = {
  id: string;
  category: WelfareNotificationCategory;
  title: string;
  body: string;
  /** Short relative label for scan (e.g. "2h ago"). */
  timeLabel: string;
  read: boolean;
  /** Expo Router path */
  href: string;
  section: NotificationSection;
};

export const NOTIFICATION_CATEGORY_LABEL: Record<WelfareNotificationCategory, string> = {
  health: 'Health',
  discipline: 'Discipline',
  scholarships: 'Scholarships',
  referrals: 'Referrals',
  campus: 'Campus',
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    category: 'health',
    title: 'Appointment confirmed',
    body: 'Your visit with Dr. Ramos on Thu, Apr 17 is confirmed. Bring your campus ID.',
    timeLabel: '2h ago',
    read: false,
    href: '/health-service',
    section: 'today',
  },
  {
    id: 'n2',
    category: 'discipline',
    title: 'Sanction proof received',
    body: 'Your reflective essay upload is with the Discipline Office for review (typically 1–3 days).',
    timeLabel: '5h ago',
    read: false,
    href: '/discipline-office',
    section: 'today',
  },
  {
    id: 'n3',
    category: 'scholarships',
    title: 'SDA: Document deadline',
    body: 'Submit your income affidavit for the merit scholarship before Apr 22 to stay eligible.',
    timeLabel: 'Today',
    read: false,
    href: '/student-development-affairs',
    section: 'today',
  },
  {
    id: 'n4',
    category: 'referrals',
    title: 'Referral accepted',
    body: 'Counseling accepted your referral. You will receive a schedule link by email (demo).',
    timeLabel: 'Yesterday',
    read: true,
    href: '/referrals',
    section: 'yesterday',
  },
  {
    id: 'n5',
    category: 'campus',
    title: 'Campus-wide: Flu walk-in',
    body: 'Free flu shots Fri 10am–2pm at the gym lobby. No appointment needed.',
    timeLabel: 'Yesterday',
    read: true,
    href: '/(tabs)',
    section: 'yesterday',
  },
  {
    id: 'n6',
    category: 'health',
    title: 'Queue update',
    body: 'You are #4 in line at Student Health. Estimated wait under 25 minutes (demo).',
    timeLabel: 'Mon',
    read: true,
    href: '/health-service',
    section: 'earlier',
  },
  {
    id: 'n7',
    category: 'discipline',
    title: 'Case status: conference scheduled',
    body: 'A case conference is set for your conduct matter. Check your email for the invite (demo).',
    timeLabel: 'Sun',
    read: true,
    href: '/discipline-office',
    section: 'earlier',
  },
  {
    id: 'n8',
    category: 'scholarships',
    title: 'Application opened',
    body: 'The Nationalian Service Grant cycle is open until May 1. Start your application in SDA.',
    timeLabel: 'Apr 10',
    read: true,
    href: '/student-development-affairs',
    section: 'earlier',
  },
];
