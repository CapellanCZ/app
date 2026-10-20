// deno-lint-ignore-file no-explicit-any
/* eslint-disable import/no-unresolved */
/**
 * send-push — Supabase Edge Function
 *
 * Triggered by a DB trigger (pg_net) on INSERT into `public.notifications`.
 * Sends Expo push for background/killed app delivery.
 * Foreground OS banners are suppressed in the mobile app (toast only).
 *
 * Deploy with verify_jwt disabled so pg_net can call it without a user JWT.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type NotificationRow = {
  id: string;
  user_id: string;
  type?: string;
  category?: string;
  title: string;
  body: string;
  href?: string | null;
  read_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: NotificationRow;
  old_record?: NotificationRow | null;
  schema?: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  priority?: 'default' | 'high';
  channelId?: string;
};

function resolveCategory(row: NotificationRow): string {
  const meta = row.metadata ?? {};
  const fromMeta = typeof meta.category === 'string' ? meta.category : null;
  return fromMeta ?? row.category ?? row.type ?? 'health';
}

type PreferenceKey = 'appointments' | 'announcements' | 'health';

function resolvePreferenceKey(row: NotificationRow): PreferenceKey {
  const type = (row.type ?? '').toLowerCase();
  const meta = row.metadata ?? {};
  const milestone =
    typeof meta.queue_milestone === 'string' ? meta.queue_milestone.toLowerCase() : null;
  const event = typeof meta.event === 'string' ? meta.event.toLowerCase() : null;
  const title = (row.title ?? '').toLowerCase();

  if (type === 'announcement') return 'announcements';

  const category =
    (typeof meta.category === 'string' ? meta.category : row.category ?? '').toLowerCase();
  if (category === 'campus') return 'announcements';

  // Visit completed + appointment lifecycle / approaching → appointments toggle.
  if (
    milestone === 'visit_completed' ||
    event === 'cancelled' ||
    event === 'rescheduled' ||
    meta.approaching === true ||
    meta.reminder === true ||
    meta.follow_up_reminder === true ||
    title.includes('visit completed') ||
    title.includes('appointment confirmed') ||
    title.includes('appointment cancelled') ||
    title.includes('appointment rescheduled') ||
    title.includes('consultation appointment is approaching') ||
    title.includes('appointment is approaching') ||
    title.includes('appointment in ') ||
    title.includes("you're all set") ||
    title.includes('youre all set') ||
    type === 'appointment' ||
    type === 'consultation_request'
  ) {
    return 'appointments';
  }

  if (type === 'queue' || (milestone && milestone !== 'visit_completed')) return 'health';

  return 'health';
}

async function isPushAllowed(
  admin: ReturnType<typeof createClient>,
  userId: string,
  row: NotificationRow,
): Promise<boolean> {
  const { data, error } = await admin
    .from('notification_preferences')
    .select('appointments, announcements, health')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[send-push] preference lookup failed:', error);
    return true;
  }

  if (!data) return true;

  const key = resolvePreferenceKey(row);
  return Boolean(data[key]);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response('Missing env', { status: 500 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'notifications' || !payload.record) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const row = payload.record;
  if (!row.user_id || !row.title) {
    return new Response(JSON.stringify({ skipped: true, reason: 'incomplete row' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const allowed = await isPushAllowed(admin, row.user_id, row);
  if (!allowed) {
    return new Response(JSON.stringify({ skipped: true, reason: 'preference disabled' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const { data: tokens, error } = await admin
    .from('device_tokens')
    .select('expo_token, platform')
    .eq('user_id', row.user_id);

  if (error) {
    console.error('[send-push] token lookup failed:', error);
    return new Response('DB error', { status: 500 });
  }

  const validTokens = (tokens ?? []).filter(
    (t: { expo_token?: string | null }) =>
      typeof t.expo_token === 'string' && t.expo_token.startsWith('ExponentPushToken'),
  );

  if (!validTokens.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no tokens' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const category = resolveCategory(row);
  const meta = row.metadata ?? {};
  const preferenceKey = resolvePreferenceKey(row);
  const messages: ExpoPushMessage[] = validTokens.map((t: any) => ({
    to: t.expo_token,
    title: row.title,
    body: row.body ?? '',
    data: {
      href: row.href ?? null,
      notificationId: row.id,
      category,
      preferenceKey,
      type: row.type ?? null,
      queue_milestone: meta.queue_milestone ?? null,
      appointment_id: meta.appointment_id ?? null,
      ticket_id: meta.ticket_id ?? null,
      notification_type: meta.notification_type ?? null,
      event: meta.event ?? null,
      approaching: meta.approaching ?? null,
    },
    sound: 'default',
    priority: 'high',
    channelId: 'default',
  }));

  const batches: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) batches.push(messages.slice(i, i + 100));

  const results: unknown[] = [];
  for (const batch of batches) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(batch),
    });
    const json = await res.json().catch(() => null);
    results.push(json);

    if (Array.isArray(json?.data)) {
      for (let i = 0; i < json.data.length; i++) {
        const ticket = json.data[i];
        if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
          const deadToken = batch[i]?.to;
          if (deadToken) {
            await admin.from('device_tokens').delete().eq('expo_token', deadToken);
          }
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ sent: messages.length, batches: results.length, results }),
    { headers: { 'content-type': 'application/json' } },
  );
});
