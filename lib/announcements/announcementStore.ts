import { create } from 'zustand';

import { fetchPublishedAnnouncements } from '@/lib/announcements/announcementsApi';
import type { Announcement } from '@/lib/announcements/types';

type AnnouncementState = {
  items: Announcement[];
  hasLoaded: boolean;
  loading: boolean;
  /** Fetch published announcements. Safe to call while skeleton is showing. */
  load: (opts?: { force?: boolean }) => Promise<void>;
};

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  items: [],
  hasLoaded: false,
  loading: false,

  load: async (opts) => {
    const { force } = opts ?? {};
    if (get().loading) return;
    if (get().hasLoaded && !force) return;

    set({ loading: true });
    try {
      const items = await fetchPublishedAnnouncements();
      set({ items, hasLoaded: true, loading: false });
    } catch (e) {
      console.error('[announcements] load failed:', e);
      set({ hasLoaded: true, loading: false });
    }
  },
}));
