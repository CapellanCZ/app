-- Harden pg_net → Edge Function calls with a shared webhook secret.
--
-- Ops setup (required before deploy of send-push / send-appointment-email):
--   1) Generate a long random secret (≥32 chars).
--   2) supabase secrets set EDGE_WEBHOOK_SECRET=<secret>
--   3) As a privileged role, insert into private.app_secrets:
--        insert into private.app_secrets(name, value)
--        values ('edge_webhook_secret', '<secret>')
--        on conflict (name) do update set value = excluded.value, updated_at = now();
--
-- Until the secret row exists, triggers skip the HTTP call (fail closed).

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.app_secrets (
  name text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on table private.app_secrets from public;
revoke all on table private.app_secrets from anon, authenticated;

create or replace function private.edge_webhook_secret()
returns text
language sql
stable
security definer
set search_path = private
as $$
  select value
  from private.app_secrets
  where name = 'edge_webhook_secret'
  limit 1;
$$;

revoke all on function private.edge_webhook_secret() from public;
revoke all on function private.edge_webhook_secret() from anon, authenticated;

create or replace function public.queue_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, private
as $$
declare
  v_url text := 'https://zrteblltvshgcienhytm.supabase.co/functions/v1/send-push';
  v_secret text;
begin
  v_secret := private.edge_webhook_secret();
  if v_secret is null or length(v_secret) < 16 then
    raise warning 'edge_webhook_secret not configured; push skipped for notification %', new.id;
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-campuscare-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'schema', 'public',
      'record', jsonb_build_object('id', new.id),
      'old_record', null
    )
  );

  return new;
end;
$$;

create or replace function public.queue_appointment_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, private
as $$
declare
  v_payload jsonb;
  v_url text := 'https://zrteblltvshgcienhytm.supabase.co/functions/v1/send-appointment-email';
  v_secret text;
begin
  v_secret := private.edge_webhook_secret();
  if v_secret is null or length(v_secret) < 16 then
    raise warning 'edge_webhook_secret not configured; appointment email skipped';
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    if new.status::text not in ('pending', 'confirmed') then
      return new;
    end if;
    v_payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'appointments',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    );
  elsif tg_op = 'UPDATE' then
    if old.status is not distinct from new.status then
      return new;
    end if;
    if new.status::text not in ('confirmed', 'cancelled') then
      return new;
    end if;
    v_payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'appointments',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    );
  else
    return coalesce(new, old);
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-campuscare-webhook-secret', v_secret
    ),
    body := v_payload
  );

  return new;
end;
$$;

create or replace function public.queue_follow_up_reminder_email(
  p_reminder_id uuid,
  p_consultation_id uuid,
  p_patient_id uuid,
  p_appointment_id uuid,
  p_follow_up_date date,
  p_provider_name text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, private
as $$
declare
  v_url text := 'https://zrteblltvshgcienhytm.supabase.co/functions/v1/send-appointment-email';
  v_secret text;
begin
  v_secret := private.edge_webhook_secret();
  if v_secret is null or length(v_secret) < 16 then
    raise warning 'edge_webhook_secret not configured; follow-up email skipped';
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-campuscare-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'FOLLOW_UP_REMINDER',
      'table', 'follow_up_reminders',
      'schema', 'public',
      'record', jsonb_build_object(
        'id', p_reminder_id,
        'consultation_id', p_consultation_id,
        'patient_id', p_patient_id,
        'appointment_id', p_appointment_id,
        'follow_up_date', p_follow_up_date,
        'provider_name', p_provider_name
      ),
      'old_record', null
    )
  );
end;
$$;

revoke all on function public.queue_follow_up_reminder_email(uuid, uuid, uuid, uuid, date, text) from public;
grant execute on function public.queue_follow_up_reminder_email(uuid, uuid, uuid, uuid, date, text) to service_role;

comment on function public.queue_notification_push() is
  'Queues Expo push via send-push; requires private.app_secrets.edge_webhook_secret.';

comment on function public.queue_appointment_email() is
  'Queues appointment emails; requires private.app_secrets.edge_webhook_secret.';
