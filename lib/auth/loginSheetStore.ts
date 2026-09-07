import { create } from 'zustand';

type LoginSheetState = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

/**
 * Opens the login / OTP sheet as a root RN Modal (not Expo Router transparentModal).
 * Native-stack transparentModal cannot paint a reliable dim scrim on iOS/Android.
 */
export const useLoginSheetStore = create<LoginSheetState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
