import { useEffect } from 'react';
import { useToast } from 'heroui-native';

import { bindAppToast } from '@/lib/ui/toastBridge';

/**
 * Registers HeroUI toast with the imperative bridge so notifications
 * (and other non-React call sites) can show toasts.
 */
export function AppToastBinder() {
  const { toast } = useToast();

  useEffect(() => {
    bindAppToast((options) => {
      toast.show({
        variant: options.variant ?? 'accent',
        placement: options.placement ?? 'top',
        duration: options.duration ?? 4500,
        label: options.label,
        description: options.description,
      });
    });
    return () => bindAppToast(null);
  }, [toast]);

  return null;
}
