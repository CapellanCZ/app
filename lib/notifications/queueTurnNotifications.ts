/**
 * Client fallback when DB queue milestone notifications fail to toast via
 * notifications realtime (e.g. brief unsubscribe, Expo Go limits).
 */
import { toastFromNotification } from '@/lib/notifications/toastFromNotification';
import { usePatientStore } from '@/lib/patients/patientStore';

const recentMilestones = new Map<string, number>();
const DEDUPE_MS = 15_000;

function markOnce(key: string): boolean {
  const now = Date.now();
  const prev = recentMilestones.get(key);
  if (prev != null && now - prev < DEDUPE_MS) return false;
  recentMilestones.set(key, now);
  return true;
}

type QueueTicketPayload = {
  id?: string;
  status?: string;
  patient_id?: string | null;
  appointment_id?: string | null;
  station?: string | null;
  queue_position?: number | null;
  queue_number?: number | null;
};

/**
 * When the signed-in patient's ticket becomes `called`, show in-app toast
 * (+ local OS alert). DB still inserts the canonical notification row.
 */
export function handleOwnedQueueTicketChange(opts: {
  eventType: string;
  next?: QueueTicketPayload | null;
  prev?: QueueTicketPayload | null;
}): void {
  const next = opts.next;
  if (!next?.id || !next.status) return;

  const myPatientId = usePatientStore.getState().patient?.id;
  if (!myPatientId || next.patient_id !== myPatientId) return;

  const nextStatus = next.status.toLowerCase();
  const prevStatus = (opts.prev?.status ?? '').toLowerCase();
  const station = (next.station?.trim() || 'clinic').toLowerCase();
  const href = next.appointment_id
    ? `/health-service/appointment/${next.appointment_id}`
    : '/appointments';

  if (
    opts.eventType === 'UPDATE' &&
    nextStatus === 'called' &&
    prevStatus !== 'called'
  ) {
    const key = `called:${next.id}`;
    if (!markOnce(key)) return;
    toastFromNotification(
      {
        id: key,
        title: "It's Your Turn",
        body: `Please proceed to the ${station} station and present your queue ticket.`,
        notificationType: 'info',
        href,
      },
      { alsoLocalOsAlert: true },
    );
  }
}
