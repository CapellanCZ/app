-- Queue Resend email when an appointment is cancelled (includes cancellation_reason in payload).

create or replace function public.queue_appointment_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_payload jsonb;
  v_url text := 'https://zrteblltvshgcienhytm.supabase.co/functions/v1/send-appointment-email';
begin
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
      'Content-Type', 'application/json'
    ),
    body := v_payload
  );

  return new;
end;
$$;

comment on function public.queue_appointment_email() is
  'Queues Resend appointment emails via Edge Function (pending, confirmed, cancelled).';
