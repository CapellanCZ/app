import { create } from 'zustand';

type ConsultationSummaryState = {
  appointmentId: string | null;
  open: (appointmentId: string) => void;
  close: () => void;
};

/**
 * Opens Consultation Summary as a root RN Modal (not an Expo Router transparentModal).
 * iOS native-stack transparentModal cannot paint a reliable dim scrim.
 */
export const useConsultationSummaryStore = create<ConsultationSummaryState>((set) => ({
  appointmentId: null,
  open: (appointmentId) => {
    const id = appointmentId.trim();
    if (!id) return;
    set({ appointmentId: id });
  },
  close: () => set({ appointmentId: null }),
}));
