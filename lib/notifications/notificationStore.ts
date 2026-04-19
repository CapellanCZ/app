import { create } from 'zustand';

import { MOCK_NOTIFICATIONS, type NotificationItem, type NotificationSection } from './mockNotifications';

interface NotificationState {
  items: NotificationItem[];
  /** Number of unread notifications. */
  unreadCount: () => number;
  /** Mark every notification in a section as read. */
  markAllReadInSection: (section: NotificationSection) => void;
  /** Remove a notification by ID. */
  archive: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [...MOCK_NOTIFICATIONS],

  unreadCount: () => get().items.filter((n) => !n.read).length,

  markAllReadInSection: (section) =>
    set((state) => ({
      items: state.items.map((n) => (n.section === section ? { ...n, read: true } : n)),
    })),

  archive: (id) =>
    set((state) => ({
      items: state.items.filter((n) => n.id !== id),
    })),
}));
