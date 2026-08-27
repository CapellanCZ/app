-- Fire Expo push when any notification row is inserted (queue turn, etc.).
-- Uses pg_net → send-push Edge Function (same pattern as appointment emails).

create extension if not exists pg_net with schema extensions;

create or replace function public.queue_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text := 'https://zrteblltvshgcienhytm.supabase.co/functions/v1/send-push';
begin
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notifications_send_push on public.notifications;
create trigger trg_notifications_send_push
  after insert on public.notifications
  for each row
  execute function public.queue_notification_push();

comment on function public.queue_notification_push() is
  'Queues Expo push via send-push Edge Function on every notifications INSERT.';
