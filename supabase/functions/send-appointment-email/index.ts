// deno-lint-ignore-file no-explicit-any
/* eslint-disable import/no-unresolved */
/**
 * send-appointment-email — Supabase Edge Function
 *
 * Triggered by DB trigger `queue_appointment_email` on `public.appointments`:
 *   - INSERT with status pending  → "request received" email
 *   - UPDATE to status confirmed  → "appointment confirmed" email
 *   - UPDATE to status cancelled  → "appointment cancelled" email (includes reason)
 *
 * Secrets:
 *   RESEND_API_KEY
 *   APPOINTMENT_EMAIL_FROM  (optional; default CampusCare sender)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AppointmentRow = {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  reason: string | null;
  location: string | null;
  cancellation_reason?: string | null;
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: AppointmentRow;
  old_record: AppointmentRow | null;
};

type EmailKind = 'pending' | 'confirmed' | 'cancelled';

const MANILA = 'Asia/Manila';

function formatWhen(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-PH', {
    timeZone: MANILA,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-PH', {
    timeZone: MANILA,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { date, time };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Friendly copy for emails from `appointments.cancellation_reason`. */
function formatCancellationReason(raw: string | null | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return 'No reason was provided. Contact the Health Service Office if you have questions.';
  }
  if (/^patient\s*cancelled?$/i.test(trimmed)) {
    return 'You cancelled this appointment.';
  }
  return trimmed;
}

function buildEmail(input: {
  kind: EmailKind;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  location: string | null;
  reason: string | null;
  cancellationReason: string | null;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(input.patientName.trim() || 'Patient');
  const doctor = escapeHtml(input.doctorName.trim() || 'the Health Service provider');
  const date = escapeHtml(input.date);
  const time = escapeHtml(input.time);
  const location = input.location ? escapeHtml(input.location) : 'Campus Health Service Office';
  const reason = input.reason ? escapeHtml(input.reason) : null;
  const cancelWhy = formatCancellationReason(input.cancellationReason);
  const cancelWhyHtml = escapeHtml(cancelWhy);

  let subject: string;
  let headline: string;
  let lead: string;
  let statusLabel: string;
  let detailsRows: [string, string][];

  if (input.kind === 'cancelled') {
    subject = 'Your appointment was cancelled — CampusCare Health Service';
    headline = 'Your appointment was cancelled';
    lead = `Hi ${name}, your appointment with <strong>${doctor}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.`;
    statusLabel = 'Cancelled';
    detailsRows = [
      ['Provider', doctor],
      ['Date', date],
      ['Time', time],
      ['Location', location],
      ['Why', cancelWhyHtml],
      ['Status', statusLabel],
    ];
  } else if (input.kind === 'confirmed') {
    subject = 'Your appointment is confirmed — CampusCare Health Service';
    headline = 'Your appointment is confirmed';
    lead = `Hi ${name}, your appointment with <strong>${doctor}</strong> is confirmed. Please arrive a few minutes early.`;
    statusLabel = 'Confirmed';
    detailsRows = [
      ['Provider', doctor],
      ['Date', date],
      ['Time', time],
      ['Location', location],
      ...(reason ? ([['Reason', reason]] as [string, string][]) : []),
      ['Status', statusLabel],
    ];
  } else {
    subject = 'We received your appointment request — CampusCare Health Service';
    headline = 'Appointment request received';
    lead = `Hi ${name}, we received your appointment request with <strong>${doctor}</strong>. It is <strong>pending confirmation</strong> from the Health Service Office. We will email you again once it is confirmed.`;
    statusLabel = 'Pending confirmation';
    detailsRows = [
      ['Provider', doctor],
      ['Date', date],
      ['Time', time],
      ['Location', location],
      ...(reason ? ([['Reason', reason]] as [string, string][]) : []),
      ['Status', statusLabel],
    ];
  }

  const rowsHtml = detailsRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:14px;width:120px;vertical-align:top;">${label}</td>
        <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">${value}</td>
      </tr>`,
    )
    .join('');

  const footerNote =
    input.kind === 'cancelled'
      ? 'You can book a new slot anytime in the CampusCare app. If you have questions, contact the Health Service Office.'
      : 'This message was sent by the Campus Health Service Office via CampusCare. If you did not request this appointment, please contact the Health Service Office.';

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#0f766e;padding:24px 28px;">
              <div style="color:#ccfbf1;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">CampusCare</div>
              <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px;">Health Service Office</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">${headline}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#334155;">${lead}</p>
              <table role="presentation" width="100%" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:8px 0 20px;">
                ${rowsHtml}
              </table>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                ${footerNote}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines: (string | null)[] = [
    headline,
    '',
  ];

  if (input.kind === 'cancelled') {
    textLines.push(
      `Hi ${input.patientName || 'Patient'}, your appointment with ${input.doctorName || 'the provider'} on ${input.date} at ${input.time} has been cancelled.`,
      '',
      `Why: ${cancelWhy}`,
    );
  } else if (input.kind === 'confirmed') {
    textLines.push(
      `Hi ${input.patientName || 'Patient'}, your appointment with ${input.doctorName || 'the provider'} is confirmed.`,
    );
  } else {
    textLines.push(
      `Hi ${input.patientName || 'Patient'}, we received your appointment request. It is pending confirmation.`,
    );
  }

  textLines.push(
    '',
    `Provider: ${input.doctorName || 'Provider'}`,
    `Date: ${input.date}`,
    `Time: ${input.time}`,
    `Location: ${input.location || 'Campus Health Service Office'}`,
    input.kind !== 'cancelled' && input.reason ? `Reason: ${input.reason}` : null,
    `Status: ${statusLabel}`,
    '',
    '— CampusCare Health Service Office',
  );

  const text = textLines.filter((line) => line != null).join('\n');

  return { subject, html, text };
}

function resolveKind(payload: WebhookPayload): EmailKind | null {
  const row = payload.record;
  if (!row) return null;

  if (payload.type === 'INSERT') {
    const status = String(row.status ?? '').toLowerCase();
    if (status === 'pending') return 'pending';
    if (status === 'confirmed') return 'confirmed';
    return null;
  }

  if (payload.type === 'UPDATE') {
    const prev = String(payload.old_record?.status ?? '').toLowerCase();
    const next = String(row.status ?? '').toLowerCase();
    if (prev !== next && next === 'confirmed') return 'confirmed';
    if (prev !== next && next === 'cancelled') return 'cancelled';
    return null;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const FROM =
    Deno.env.get('APPOINTMENT_EMAIL_FROM') ??
    'NU Dasmarinas Health Services Office <nud-hso@campuscare.click>';

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response('Missing Supabase env', { status: 500 });
  }
  if (!RESEND_API_KEY) {
    return new Response('Missing RESEND_API_KEY', { status: 500 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  if (payload.table !== 'appointments' || !payload.record) {
    return new Response(JSON.stringify({ skipped: true, reason: 'not appointments' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const kind = resolveKind(payload);
  if (!kind) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no email for this change' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const row = payload.record;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: patient, error: patientError } = await admin
    .from('patients')
    .select('full_name, email')
    .eq('id', row.patient_id)
    .maybeSingle();

  if (patientError) {
    console.error('[send-appointment-email] patient lookup:', patientError);
    return new Response('Patient lookup failed', { status: 500 });
  }

  const to = (patient?.email as string | null)?.trim();
  if (!to) {
    return new Response(JSON.stringify({ skipped: true, reason: 'patient has no email' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const { data: doctor } = await admin
    .from('users')
    .select('full_name')
    .eq('id', row.doctor_id)
    .maybeSingle();

  const { date, time } = formatWhen(row.starts_at);
  const email = buildEmail({
    kind,
    patientName: (patient?.full_name as string) ?? 'Patient',
    doctorName: (doctor?.full_name as string) ?? 'Health Service provider',
    date,
    time,
    location: row.location,
    reason: row.reason,
    cancellationReason: row.cancellation_reason ?? null,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('[send-appointment-email] Resend error:', res.status, body);
    return new Response(JSON.stringify({ ok: false, status: res.status, body }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, kind, to, resend: body }),
    { headers: { 'content-type': 'application/json' } },
  );
});
