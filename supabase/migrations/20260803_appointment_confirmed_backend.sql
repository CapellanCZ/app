-- Confirmed-appointment backend for CampusCare mobile:
-- device_tokens, appointment_reminders, confirm → notification, reminder delivery.

-- ── Device tokens (Expo push) ─────────────────────────────
create table if not exists public.device_tokens (
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_id     text not null,
  expo_token    text not null,
  platform      text not null check (platform in ('ios','android','web')),
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  primary key (user_id, device_id)
);

create index if not exists device_tokens_user_idx
  on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

drop policy if exists "device_tokens_own_all" on public.device_tokens;
create policy "device_tokens_own_all"
  on public.device_tokens for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.device_tokens to authenticated;

-- ── Allow appointment notifications on live notifications.type ──
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type = any (array[
    'consultation_request'::text,
    'queue'::text,
    'announcement'::text,
    'appointment'::text
  ]));

-- ── Appointment reminders ─────────────────────────────────
create table if not exists public.appointment_reminders (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  remind_at       timestamptz not null,
  minutes_before  integer not null default 30
                    check (minutes_before > 0 and minutes_before <= 1440),
  status          text not null default 'scheduled'
                    check (status in ('scheduled', 'sent', 'cancelled')),
  created_at      timestamptz not null default now(),
  unique (appointment_id)
);

create index if not exists appointment_reminders_due_idx
  on public.appointment_reminders (remind_at)
  where status = 'scheduled';

alter table public.appointment_reminders enable row level security;

drop policy if exists "appointment_reminders_select_own" on public.appointment_reminders;
create policy "appointment_reminders_select_own"
  on public.appointment_reminders for select
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = appointment_reminders.patient_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "appointment_reminders_insert_own" on public.appointment_reminders;
create policy "appointment_reminders_insert_own"
  on public.appointment_reminders for insert
  to authenticated
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "appointment_reminders_update_own" on public.appointment_reminders;
create policy "appointment_reminders_update_own"
  on public.appointment_reminders for update
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = appointment_reminders.patient_id
        and p.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_id
        and p.auth_user_id = auth.uid()
    )
  );

grant select, insert, update on public.appointment_reminders to authenticated;

-- ── RPC: schedule reminder (default 30 minutes before) ────
create or replace function public.schedule_appointment_reminder(
  p_appointment_id uuid,
  p_minutes_before integer default 30
)
returns public.appointment_reminders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_auth_uid uuid := auth.uid();
  v_starts_at timestamptz;
  v_status text;
  v_remind_at timestamptz;
  v_row public.appointment_reminders;
begin
  if v_auth_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_minutes_before is null or p_minutes_before < 5 or p_minutes_before > 1440 then
    raise exception 'Invalid minutes_before';
  end if;

  select a.patient_id, a.starts_at, a.status::text
    into v_patient_id, v_starts_at, v_status
  from public.appointments a
  join public.patients p on p.id = a.patient_id
  where a.id = p_appointment_id
    and p.auth_user_id = v_auth_uid;

  if v_patient_id is null then
    raise exception 'Appointment not found';
  end if;

  if v_status not in ('confirmed', 'rescheduled', 'in_progress') then
    raise exception 'Reminders are only available for confirmed appointments';
  end if;

  v_remind_at := v_starts_at - make_interval(mins => p_minutes_before);

  if v_remind_at <= now() then
    raise exception 'Too close to appointment start to set this reminder';
  end if;

  insert into public.appointment_reminders (
    appointment_id, patient_id, remind_at, minutes_before, status
  )
  values (
    p_appointment_id, v_patient_id, v_remind_at, p_minutes_before, 'scheduled'
  )
  on conflict (appointment_id) do update
    set remind_at = excluded.remind_at,
        minutes_before = excluded.minutes_before,
        status = 'scheduled'
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.schedule_appointment_reminder(uuid, integer) from public;
grant execute on function public.schedule_appointment_reminder(uuid, integer) to authenticated;

-- ── Trigger: pending → confirmed inserts patient notification ──
create or replace function public.notify_patient_appointment_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_doctor_name text;
begin
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status::text = 'confirmed'
  then
    -- notifications.user_id FK → public.users.id (same uuid as patient auth_user_id when linked)
    select p.auth_user_id into v_user_id
    from public.patients p
    where p.id = new.patient_id;

    if v_user_id is null then
      return new;
    end if;

    -- Only insert if this uuid exists in public.users (FK requirement)
    if not exists (select 1 from public.users u where u.id = v_user_id) then
      return new;
    end if;

    select u.full_name into v_doctor_name
    from public.users u
    where u.id = new.doctor_id;

    insert into public.notifications (user_id, type, title, body, href, metadata)
    values (
      v_user_id,
      'appointment',
      'Appointment Confirmed!',
      format(
        'Your appointment with %s has been confirmed. You''re all set!',
        coalesce(v_doctor_name, 'the provider')
      ),
      format('/health-service/appointment/%s', new.id),
      jsonb_build_object(
        'appointment_id', new.id,
        'category', 'health',
        'notification_type', 'success'
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_appointments_notify_confirmed on public.appointments;
create trigger trg_appointments_notify_confirmed
  after update of status on public.appointments
  for each row
  execute function public.notify_patient_appointment_confirmed();

-- ── Deliver due reminders into notifications ──────────────
create or replace function public.deliver_due_appointment_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  r record;
  v_user_id uuid;
  v_doctor_name text;
begin
  for r in
    select rem.id as reminder_id,
           rem.appointment_id,
           rem.patient_id,
           rem.minutes_before,
           a.doctor_id
    from public.appointment_reminders rem
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
      select u.full_name into v_doctor_name
      from public.users u
      where u.id = r.doctor_id;

      insert into public.notifications (user_id, type, title, body, href, metadata)
      values (
        v_user_id,
        'appointment',
        format('Appointment in %s minutes', r.minutes_before),
        format(
          'Your visit with %s starts soon. Bring your school ID.',
          coalesce(v_doctor_name, 'the provider')
        ),
        format('/health-service/appointment/%s', r.appointment_id),
        jsonb_build_object(
          'appointment_id', r.appointment_id,
          'category', 'health',
          'notification_type', 'info',
          'reminder', true
        )
      );
    end if;

    update public.appointment_reminders
    set status = 'sent'
    where id = r.reminder_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.deliver_due_appointment_reminders() from public;
grant execute on function public.deliver_due_appointment_reminders() to service_role;
