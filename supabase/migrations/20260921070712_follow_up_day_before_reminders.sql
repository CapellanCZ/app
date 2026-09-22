-- Follow-up reminders: notify + email patients 1 day before consultations.follow_up_date.
-- Mirrors appointment_reminders delivery; schedules automatically when doctors set a follow-up.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- ── Table ─────────────────────────────────────────────────
create table if not exists public.follow_up_reminders (
  id                uuid primary key default gen_random_uuid(),
  consultation_id   uuid not null references public.consultations(id) on delete cascade,
  patient_id        uuid not null references public.patients(id) on delete cascade,
  appointment_id    uuid null references public.appointments(id) on delete set null,
  follow_up_date    date not null,
  remind_at         timestamptz not null,
  days_before       integer not null default 1
                      check (days_before > 0 and days_before <= 30),
  status            text not null default 'scheduled'
                      check (status in ('scheduled', 'sent', 'cancelled')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (consultation_id)
);

create index if not exists follow_up_reminders_due_idx
  on public.follow_up_reminders (remind_at)
  where status = 'scheduled';

alter table public.follow_up_reminders enable row level security;

drop policy if exists "follow_up_reminders_select_own" on public.follow_up_reminders;
create policy "follow_up_reminders_select_own"
  on public.follow_up_reminders for select
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = follow_up_reminders.patient_id
        and p.auth_user_id = auth.uid()
    )
  );

grant select on public.follow_up_reminders to authenticated;

comment on table public.follow_up_reminders is
  'Scheduled 1-day-before reminders for doctor-set consultations.follow_up_date.';

-- ── Compute remind_at (08:00 Asia/Manila on the day before) ─
create or replace function public.follow_up_remind_at(
  p_follow_up_date date,
  p_days_before integer default 1
)
returns timestamptz
language sql
immutable
as $$
  select ((p_follow_up_date - p_days_before) + time '08:00') at time zone 'Asia/Manila';
$$;

revoke all on function public.follow_up_remind_at(date, integer) from public;
grant execute on function public.follow_up_remind_at(date, integer) to authenticated;
grant execute on function public.follow_up_remind_at(date, integer) to service_role;

-- ── Upsert / cancel when follow_up_date changes ───────────
create or replace function public.schedule_follow_up_reminder_from_consultation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_remind_at timestamptz;
  v_today_manila date;
begin
  if tg_op = 'DELETE' then
    update public.follow_up_reminders
    set status = 'cancelled', updated_at = now()
    where consultation_id = old.id
      and status = 'scheduled';
    return old;
  end if;

  -- No follow-up → cancel any pending reminder
  if new.follow_up_date is null then
    update public.follow_up_reminders
    set status = 'cancelled', updated_at = now()
    where consultation_id = new.id
      and status = 'scheduled';
    return new;
  end if;

  -- Only act when follow_up_date is set or changed
  if tg_op = 'UPDATE'
     and old.follow_up_date is not distinct from new.follow_up_date
  then
    return new;
  end if;

  v_patient_id := new.patient_id;
  if v_patient_id is null then
    return new;
  end if;

  v_today_manila := (timezone('Asia/Manila', now()))::date;

  -- Follow-up already due/past → do not schedule
  if new.follow_up_date <= v_today_manila then
    update public.follow_up_reminders
    set status = 'cancelled', updated_at = now()
    where consultation_id = new.id
      and status = 'scheduled';
    return new;
  end if;

  v_remind_at := public.follow_up_remind_at(new.follow_up_date, 1);

  insert into public.follow_up_reminders (
    consultation_id,
    patient_id,
    appointment_id,
    follow_up_date,
    remind_at,
    days_before,
    status,
    updated_at
  )
  values (
    new.id,
    v_patient_id,
    new.appointment_id,
    new.follow_up_date,
    v_remind_at,
    1,
    'scheduled',
    now()
  )
  on conflict (consultation_id) do update
    set patient_id = excluded.patient_id,
        appointment_id = excluded.appointment_id,
        follow_up_date = excluded.follow_up_date,
        remind_at = excluded.remind_at,
        days_before = excluded.days_before,
        status = 'scheduled',
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_consultations_schedule_follow_up_reminder on public.consultations;
create trigger trg_consultations_schedule_follow_up_reminder
  after insert or delete or update of follow_up_date
  on public.consultations
  for each row
  execute function public.schedule_follow_up_reminder_from_consultation();

-- ── Queue follow-up reminder email via Edge Function ──────
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
set search_path = public, extensions
as $$
declare
  v_url text := 'https://zrteblltvshgcienhytm.supabase.co/functions/v1/send-appointment-email';
begin
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
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

-- ── Deliver due reminders → in-app notification (+ push) + email ─
create or replace function public.deliver_due_follow_up_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  r record;
  v_user_id uuid;
  v_provider_name text;
  v_href text;
  v_date_label text;
begin
  for r in
    select
      rem.id as reminder_id,
      rem.consultation_id,
      rem.patient_id,
      rem.appointment_id,
      rem.follow_up_date,
      c.provider_name
    from public.follow_up_reminders rem
    join public.consultations c on c.id = rem.consultation_id
    where rem.status = 'scheduled'
      and rem.remind_at <= now()
      and rem.follow_up_date > (timezone('Asia/Manila', now()))::date
    order by rem.remind_at
    limit 100
  loop
    select p.auth_user_id into v_user_id
    from public.patients p
    where p.id = r.patient_id;

    v_provider_name := nullif(trim(coalesce(r.provider_name, '')), '');
    v_date_label := to_char(r.follow_up_date, 'FMDay, FMMonth FMDD, YYYY');

    if r.appointment_id is not null then
      v_href := format('/visit-completed?id=%s', r.appointment_id);
    else
      v_href := '/appointments?tab=past';
    end if;

    if v_user_id is not null
       and exists (select 1 from public.users u where u.id = v_user_id)
    then
      insert into public.notifications (user_id, type, title, body, href, metadata)
      values (
        v_user_id,
        'appointment',
        'Follow-up tomorrow',
        format(
          'Reminder: your clinic follow-up with %s is scheduled for %s. Please book or arrive as advised by Health Service.',
          coalesce(v_provider_name, 'your provider'),
          v_date_label
        ),
        v_href,
        jsonb_build_object(
          'consultation_id', r.consultation_id,
          'appointment_id', r.appointment_id,
          'follow_up_date', r.follow_up_date,
          'category', 'health',
          'notification_type', 'info',
          'reminder', true,
          'follow_up_reminder', true
        )
      );
    end if;

    perform public.queue_follow_up_reminder_email(
      r.reminder_id,
      r.consultation_id,
      r.patient_id,
      r.appointment_id,
      r.follow_up_date,
      v_provider_name
    );

    update public.follow_up_reminders
    set status = 'sent', updated_at = now()
    where id = r.reminder_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.deliver_due_follow_up_reminders() from public;
grant execute on function public.deliver_due_follow_up_reminders() to service_role;

-- ── Cron: every 15 minutes (also wires appointment reminders if unused) ─
do $$
begin
  -- Unschedule prior jobs with the same names (idempotent re-apply)
  if exists (select 1 from cron.job where jobname = 'deliver-follow-up-reminders') then
    perform cron.unschedule('deliver-follow-up-reminders');
  end if;
  if exists (select 1 from cron.job where jobname = 'deliver-appointment-reminders') then
    perform cron.unschedule('deliver-appointment-reminders');
  end if;

  perform cron.schedule(
    'deliver-follow-up-reminders',
    '*/15 * * * *',
    $cron$select public.deliver_due_follow_up_reminders();$cron$
  );

  perform cron.schedule(
    'deliver-appointment-reminders',
    '*/15 * * * *',
    $cron$select public.deliver_due_appointment_reminders();$cron$
  );
exception
  when undefined_table then
    raise notice 'cron.job not available yet; schedule manually after pg_cron is ready';
  when others then
    raise notice 'Could not schedule cron jobs: %', sqlerrm;
end;
$$;

-- ── Backfill future follow-ups already on file ────────────
insert into public.follow_up_reminders (
  consultation_id,
  patient_id,
  appointment_id,
  follow_up_date,
  remind_at,
  days_before,
  status
)
select
  c.id,
  c.patient_id,
  c.appointment_id,
  c.follow_up_date,
  public.follow_up_remind_at(c.follow_up_date, 1),
  1,
  'scheduled'
from public.consultations c
where c.follow_up_date is not null
  and c.patient_id is not null
  and c.follow_up_date > (timezone('Asia/Manila', now()))::date
on conflict (consultation_id) do nothing;
