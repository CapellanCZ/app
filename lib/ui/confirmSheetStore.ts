import { create } from 'zustand';

export type ConfirmSheetIcon = 'danger' | 'info' | 'none';

export type ConfirmSheetRequest = {
  title: string;
  message: string;
  icon?: ConfirmSheetIcon;
  /** Safe / keep action (filled dark button). */
  cancelLabel?: string;
  /** Confirm action label. */
  confirmLabel: string;
  /** When true, confirm uses destructive styling. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

export type OptionSheetRequest = {
  title: string;
  message?: string;
  options: { id: string; label: string; selected?: boolean }[];
  onSelect: (id: string) => void;
  onCancel?: () => void;
};

type ConfirmSheetState = {
  confirm: ConfirmSheetRequest | null;
  options: OptionSheetRequest | null;
  showConfirm: (request: ConfirmSheetRequest) => void;
  showOptions: (request: OptionSheetRequest) => void;
  hide: () => void;
};

export const useConfirmSheetStore = create<ConfirmSheetState>((set) => ({
  confirm: null,
  options: null,
  showConfirm: (request) => set({ confirm: request, options: null }),
  showOptions: (request) => set({ options: request, confirm: null }),
  hide: () => set({ confirm: null, options: null }),
}));

/** Imperative confirm — matches CampusCare bottom-sheet UI (not system Alert). */
export function showConfirmSheet(request: ConfirmSheetRequest) {
  useConfirmSheetStore.getState().showConfirm(request);
}

/** Imperative single-button info sheet. */
export function showInfoSheet(request: {
  title: string;
  message: string;
  okLabel?: string;
  icon?: ConfirmSheetIcon;
  onClose?: () => void;
}) {
  useConfirmSheetStore.getState().showConfirm({
    title: request.title,
    message: request.message,
    icon: request.icon ?? 'info',
    confirmLabel: request.okLabel ?? 'Got it',
    destructive: false,
    cancelLabel: undefined,
    onConfirm: () => request.onClose?.(),
  });
}

/** Imperative option picker sheet (e.g. date range). */
export function showOptionSheet(request: OptionSheetRequest) {
  useConfirmSheetStore.getState().showOptions(request);
}
