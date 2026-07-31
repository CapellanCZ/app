/**
 * Demo notifications — replace with API / Supabase when wired.
 */
import type { NotificationItem } from './types';

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'appt-confirmed',
    category: 'health',
    title: 'Appointment Confirmed',
    body: 'Your clinic visit has been confirmed. Please arrive 10 minutes early.',
    timeLabel: '2h ago',
    read: false,
    href: '/health-service/appointments',
    source: 'Health Service',
    notificationType: 'success',
    section: 'today',
  },
  {
    id: 'appt-reminder',
    category: 'health',
    title: 'Upcoming Visit Reminder',
    body: 'You have a scheduled clinic appointment tomorrow. Don\u2019t forget to bring your school ID.',
    timeLabel: '5h ago',
    read: false,
    href: '/health-service/appointments',
    source: 'Health Service',
    notificationType: 'info',
    section: 'today',
  },
  {
    id: 'clinic-hours',
    category: 'campus',
    title: 'Clinic Hours Update',
    body: 'The campus clinic will follow regular office hours this week. Walk-ins are accepted for same-day visits.',
    timeLabel: 'Yesterday',
    read: true,
    href: '/health-service',
    source: 'Campus',
    notificationType: 'info',
    section: 'yesterday',
  },
];
