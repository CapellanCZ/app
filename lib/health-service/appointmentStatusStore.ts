import { create } from 'zustand';

type AppointmentStatusState = {
  appointmentId: string | null;
  open: (appointmentId: string) => void;
  close: () => void;
};

/**
 * Opens pending/confirmed appointment status as a root RN Modal (content-sized sheet).
 * Avoids Expo Router full-screen / transparentModal dim issues on iOS.
 */
export const useAppointmentStatusStore = create<AppointmentStatusState>((set) => ({
  appointmentId: null,
  open: (appointmentId) => {
    const id = appointmentId.trim();
    if (!id) return;
    set({ appointmentId: id });
  },
  close: () => set({ appointmentId: null }),
}));
