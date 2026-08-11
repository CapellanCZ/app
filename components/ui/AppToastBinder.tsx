import { useEffect } from 'react';
import { useToast } from 'heroui-native';

import { NotificationTypeIcon } from '@/components/notifications/NotificationTypeIcon';
import type { NotificationStatusType } from '@/lib/notifications/types';
import { bindAppToast, type AppToastOptions } from '@/lib/ui/toastBridge';

function statusFromToast(options: AppToastOptions): NotificationStatusType {
  if (options.status) return options.status;
  switch (options.variant) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'error';
    case 'accent':
    case 'default':
    default:
      return 'info';
  }
}

/**
 * Registers HeroUI toast with the imperative bridge so notifications
 * (and other non-React call sites) can show toasts.
 * Leading icons match the notification list (`NotificationTypeIcon`).
 */
export function AppToastBinder() {
  const { toast } = useToast();

  useEffect(() => {
    bindAppToast((options) => {
      const status = statusFromToast(options);
      toast.show({
        variant: options.variant ?? 'accent',
        placement: options.placement ?? 'top',
        duration: options.duration ?? 4500,
        label: options.label,
        description: options.description,
        icon: <NotificationTypeIcon variant={status} size={36} />,
      });
    });
    return () => bindAppToast(null);
  }, [toast]);

  return null;
}
