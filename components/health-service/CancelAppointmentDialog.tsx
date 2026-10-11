import type { AppointmentStatus } from '@/lib/health-service/types';
import { showConfirmSheet } from '@/lib/ui/confirmSheetStore';

/**
 * CampusCare confirm sheet for cancelling a pending request or confirmed appointment.
 * Prefer in-sheet confirm inside AppointmentStatusHost (avoids Android nested Modal).
 * Use this helper from screens that are not already inside a Modal.
 */
export function confirmCancelAppointment(options: {
  staffName: string;
  whenLabel: string;
  status: Extract<AppointmentStatus, 'pending' | 'confirmed' | 'rescheduled'>;
  onConfirm: () => void;
}): void {
  const { staffName, whenLabel, status, onConfirm } = options;
  const isPending = status === 'pending';

  showConfirmSheet({
    title: isPending ? 'Cancel this request?' : 'Cancel appointment?',
    message: isPending
      ? `${whenLabel} with ${staffName}. Your booking has not been confirmed yet.`
      : `Cancel your appointment with ${staffName} on ${whenLabel}?`,
    icon: 'danger',
    cancelLabel: 'Keep',
    confirmLabel: isPending ? 'Cancel request' : 'Cancel appointment',
    destructive: true,
    onConfirm,
  });
}
