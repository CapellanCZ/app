-- Auto "Consultation Appointment is approaching" — day before confirmed visits.
-- Separate from opt-in 30-minute appointment_reminders so both can coexist.

create table if not exists public.appointment_approaching_reminders (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  appointment_date date not null,
  remind_at       timestamptz not null,
  days_before     integer not null default 1
                    check (days_before > 0 and days_before <= 30),
  status          text not null default 'scheduled'
                    check (status in ('scheduled', 'sent', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (appointment_id)
);

create index if not exists appointment_approaching_reminders_due_idx
  on public.appointment_approaching_reminders (remind_at)
  where status = 'scheduled';

alter table public.appointment_approaching_reminders enable row level security;

drop policy if exists "appointment_approaching_reminders_select_own"
  on public.appointment_approaching_reminders;
create policy "appointment_approaching_reminders_select_own"
  on public.appointment_approaching_reminders for select
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = appointment_approaching_reminders.patient_id
        and p.auth_user_id = auth.uid()
    )
  );

grant select on public.appointment_approaching_reminders to authenticated;

comment on table public.appointment_approaching_reminders is
  'Day-before approaching notifications for confirmed/rescheduled appointments.';

-- 08:00 Asia/Manila on the calendar day before the appointment date
create or replace function public.appointment_approaching_remind_at(
  p_appointment_date date,
  p_days_before integer default 1
)
returns timestamptz
language sql
immutable
as $$
  select ((p_appointment_date - p_days_before) + time '08:00') at time zone 'Asia/Manila';
$$;

revoke all on function public.appointment_approaching_remind_at(date, integer) from public;
grant execute on function public.appointment_approaching_remind_at(date, integer) to authenticated;
grant execute on function public.appointment_approaching_remind_at(date, integer) to service_role;

create or replace function public.sync_appointment_approaching_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_appt_date date;
  v_remind_at timestamptz;
  v_today date;
begin
  v_status := lower(coalesce(new.status::text, ''));

  -- Cancel for declined / cancelled / completed / no_show / other inactive
  if v_status not in ('confirmed', 'rescheduled', 'in_progress') then
    update public.appointment_approaching_reminders
    set status = 'cancelled', updated_at = now()
    where appointment_id = new.id
      and status = 'scheduled';
    return new;
  end if;

  if new.starts_at is null or new.patient_id is null then
    return new;
  end if;

  v_appt_date := (timezone('Asia/Manila', new.starts_at))::date;
  v_today := (timezone('Asia/Manila', now()))::date;

  -- Appointment today or past → no approaching reminder
  if v_appt_date <= v_today then
    update public.appointment_approaching_reminders
    set status = 'cancelled', updated_at = now()
    where appointment_id = new.id
      and status = 'scheduled';
    return new;
  end if;

  v_remind_at := public.appointment_approaching_remind_at(v_appt_date, 1);

  insert into public.appointment_approaching_reminders (
    appointment_id,
    patient_id,
    appointment_date,
    remind_at,
    days_before,
    status
  )
  values (
    new.id,
    new.patient_id,
    v_appt_date,
    v_remind_at,
    1,
    'scheduled'
  )
  on conflict (appointment_id) do update
    set patient_id = excluded.patient_id,
        appointment_date = excluded.appointment_date,
        remind_at = excluded.remind_at,
        days_before = excluded.days_before,
        status = 'scheduled',
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_appointments_sync_approaching_reminder on public.appointments;
create trigger trg_appointments_sync_approaching_reminder
  after insert or update of status, starts_at, patient_id
  on public.appointments
  for each row
  execute function public.sync_appointment_approaching_reminder();

create or replace function public.deliver_due_appointment_approaching_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  r record;
  v_user_id uuid;
  v_date_label text;
begin
  for r in
    select rem.id as reminder_id,
           rem.appointment_id,
           rem.patient_id,
           rem.appointment_date,
           a.starts_at
    from public.appointment_approaching_reminders rem
    join public.appointments a on a.id = rem.appointment_id
    where rem.status = 'scheduled'
      and rem.remind_at <= now()
      and a.status::text in ('confirmed', 'rescheduled', 'in_progress')
    order by rem.remind_at
    limit 100
  loop
    select p.auth_user_id into v_user_id
    from public.patients p
    where p.id = r.patient_id;

    if v_user_id is not null
       and exists (select 1 from public.users u where u.id = v_user_id)
    then
      v_date_label := to_char(
        timezone('Asia/Manila', r.starts_at),
        'FMMonth FMDD, YYYY'
      );

      if not exists (
        select 1
        from public.notifications n
        where n.user_id = v_user_id
          and n.metadata->>'appointment_id' = r.appointment_id::text
          and n.metadata->>'approaching' = 'true'
          and n.title = 'Consultation Appointment is approaching'
      ) then
        insert into public.notifications (user_id, type, title, body, href, metadata)
        values (
          v_user_id,
          'appointment',
          'Consultation Appointment is approaching',
          format(
            'Your consultation is scheduled for %s.',
            coalesce(v_date_label, r.appointment_date::text)
          ),
          format('/health-service/appointment/%s', r.appointment_id),
          jsonb_build_object(
            'appointment_id', r.appointment_id,
            'category', 'health',
            'notification_type', 'info',
            'approaching', true
          )
        );
      end if;
    end if;

    update public.appointment_approaching_reminders
    set status = 'sent', updated_at = now()
    where id = r.reminder_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.deliver_due_appointment_approaching_reminders() from public;
grant execute on function public.deliver_due_appointment_approaching_reminders() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'deliver-appointment-approaching-reminders') then
    perform cron.unschedule('deliver-appointment-approaching-reminders');
  end if;

  perform cron.schedule(
    'deliver-appointment-approaching-reminders',
    '*/15 * * * *',
    $cron$select public.deliver_due_appointment_approaching_reminders();$cron$
  );
exception
  when undefined_table then
    raise notice 'cron.job not available yet; schedule manually after pg_cron is ready';
  when others then
    raise notice 'Could not schedule approaching-reminder cron: %', sqlerrm;
end;
$$;

-- Backfill upcoming confirmed/rescheduled appointments
insert into public.appointment_approaching_reminders (
  appointment_id,
  patient_id,
  appointment_date,
  remind_at,
  days_before,
  status
)
select
  a.id,
  a.patient_id,
  (timezone('Asia/Manila', a.starts_at))::date,
  public.appointment_approaching_remind_at(
    (timezone('Asia/Manila', a.starts_at))::date,
    1
  ),
  1,
  'scheduled'
from public.appointments a
where a.status::text in ('confirmed', 'rescheduled')
  and a.starts_at is not null
  and a.patient_id is not null
  and (timezone('Asia/Manila', a.starts_at))::date
      > (timezone('Asia/Manila', now()))::date
on conflict (appointment_id) do nothing;
