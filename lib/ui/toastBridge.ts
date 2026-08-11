type ToastVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export type AppToastOptions = {
  variant?: ToastVariant;
  placement?: 'top' | 'bottom';
  duration?: number;
  label: string;
  description?: string;
};

type ToastShowFn = (options: AppToastOptions) => void;

let boundShow: ToastShowFn | null = null;

/** Bind HeroUI `useToast().toast.show` from a mounted React tree. */
export function bindAppToast(show: ToastShowFn | null) {
  boundShow = show;
}

/** Imperative toast for stores / realtime (no-op until binder mounts). */
export function showAppToast(options: AppToastOptions) {
  if (!boundShow) {
    console.warn('[toast] showAppToast called before AppToastBinder mounted', options.label);
    return;
  }

  // Fire-and-forget feedback — never block the toast UI.
  void import('@/lib/ui/feedbackSound').then(({ playToastFeedback }) =>
    playToastFeedback(options.variant ?? 'accent'),
  );

  boundShow(options);
}
