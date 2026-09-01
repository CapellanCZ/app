import { create } from 'zustand';

import { fetchPublishedAnnouncements, MAX_ANNOUNCEMENT_SLIDES } from '@/lib/announcements/announcementsApi';
import type { Announcement } from '@/lib/announcements/types';
import { usePatientStore } from '@/lib/patients/patientStore';

type LoadOptions = {
  force?: boolean;
  patientType?: string | null;
};

type AnnouncementState = {
  items: Announcement[];
  hasLoaded: boolean;
  loading: boolean;
  lastPatientType: string | null;
  /** Fetch published announcements. Safe to call while skeleton is showing. */
  load: (opts?: LoadOptions) => Promise<void>;
};

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  items: [],
  hasLoaded: false,
  loading: false,
  lastPatientType: null,

  load: async (opts) => {
    const { force } = opts ?? {};
    const patientType =
      opts?.patientType ?? usePatientStore.getState().patient?.patient_type ?? null;
    const typeChanged = get().lastPatientType !== patientType;

    if (get().loading) return;
    if (get().hasLoaded && !force && !typeChanged) return;

    set({ loading: true });
    try {
      const items = (await fetchPublishedAnnouncements(patientType)).slice(
        0,
        MAX_ANNOUNCEMENT_SLIDES,
      );
      set({
        items,
        hasLoaded: true,
        loading: false,
        lastPatientType: patientType,
      });
    } catch (e) {
      console.error('[announcements] load failed:', e);
      set({ hasLoaded: true, loading: false });
    }
  },
}));
