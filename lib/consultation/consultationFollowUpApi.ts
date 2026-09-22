import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { formatAppointmentBookedDate } from '@/lib/health-service/appointmentDisplay';

/** Normalize Postgres `date` / ISO strings to `YYYY-MM-DD`. */
export function normalizeFollowUpDateKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dayOnly = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (dayOnly) return dayOnly[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatConsultationFollowUpLabel(dateKey: string): string {
  return formatAppointmentBookedDate(dateKey);
}

/**
 * Latest follow-up date for a completed appointment (from `consultations.follow_up_date`).
 */
export async function fetchConsultationFollowUpDate(
  appointmentId: string,
): Promise<string | null> {
  if (!appointmentId?.trim() || !isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('consultations')
    .select('follow_up_date, updated_at, created_at')
    .eq('appointment_id', appointmentId)
    .not('follow_up_date', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[consultation] fetchConsultationFollowUpDate:', error.message);
    return null;
  }

  return normalizeFollowUpDateKey(data?.follow_up_date);
}

/**
 * Live updates when clinic staff set/change `consultations.follow_up_date` for this appointment.
 */
export function subscribeConsultationFollowUpDate(
  appointmentId: string,
  onChange: (dateKey: string | null) => void,
): () => void {
  if (!appointmentId?.trim() || !isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channelName = `consultation-follow-up:${appointmentId}`;

  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'consultations',
        filter: `appointment_id=eq.${appointmentId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as { follow_up_date?: unknown } | null;
        if (!row || payload.eventType === 'DELETE') {
          // Row removed — re-fetch in case another consultation still has a date.
          void fetchConsultationFollowUpDate(appointmentId).then(onChange);
          return;
        }
        const next = normalizeFollowUpDateKey(row.follow_up_date);
        if (next) {
          onChange(next);
          return;
        }
        void fetchConsultationFollowUpDate(appointmentId).then(onChange);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[consultation] follow-up realtime status:', status);
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}
