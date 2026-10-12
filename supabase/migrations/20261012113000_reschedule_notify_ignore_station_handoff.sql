-- Station handoffs (nurse → dentist) often bump appointments.starts_at to now()
-- while setting status to in_progress. That is not a patient-facing reschedule.

create or replace function public.notify_patient_appointment_rescheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_doctor_name text;
  v_status text;
  v_old_status text;
  v_became_rescheduled boolean;
  v_time_moved boolean;
  v_when text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  v_status := lower(coalesce(new.status::text, ''));
  v_old_status := lower(coalesce(old.status::text, ''));

  -- Explicit clinic reschedule status.
  v_became_rescheduled :=
    old.status is distinct from new.status
    and v_status = 'rescheduled';

  -- Time change only counts as reschedule while still in a booking state.
  -- Skip in_progress / completed / queue handoffs that rewrite starts_at.
  v_time_moved :=
    old.starts_at is distinct from new.starts_at
    and v_status in ('pending', 'confirmed', 'rescheduled')
    and v_old_status in ('pending', 'confirmed', 'rescheduled');

  if not v_became_rescheduled and not v_time_moved then
    return new;
  end if;

  -- Avoid duplicate with the confirmed notification on pending → confirmed.
  if old.status is distinct from new.status
     and v_status = 'confirmed'
     and not v_time_moved then
    return new;
  end if;

  select p.auth_user_id into v_user_id
  from public.patients p
  where p.id = new.patient_id;

  if v_user_id is null then
    return new;
  end if;

  if not exists (select 1 from public.users u where u.id = v_user_id) then
    return new;
  end if;

  select u.full_name into v_doctor_name
  from public.users u
  where u.id = new.doctor_id;

  if new.starts_at is not null then
    v_when := to_char(
      timezone('Asia/Manila', new.starts_at),
      'FMDay, DD Mon YYYY at FMHH12:MI AM'
    );
  end if;

  insert into public.notifications (user_id, type, title, body, href, metadata)
  values (
    v_user_id,
    'appointment',
    'Appointment Rescheduled',
    case
      when v_when is not null then
        format(
          'Your appointment with %s was moved to %s. Open Appointments to review the new schedule.',
          coalesce(nullif(trim(v_doctor_name), ''), 'your campus provider'),
          v_when
        )
      else
        format(
          'Your appointment with %s was rescheduled. Open Appointments to review the new schedule.',
          coalesce(nullif(trim(v_doctor_name), ''), 'your campus provider')
        )
    end,
    format('/health-service/appointment/%s', new.id),
    jsonb_build_object(
      'appointment_id', new.id,
      'category', 'health',
      'notification_type', 'warning',
      'source', 'Health Service',
      'event', 'rescheduled'
    )
  );

  if v_time_moved and new.starts_at is not null then
    update public.appointment_reminders rem
    set
      remind_at = new.starts_at - make_interval(mins => rem.minutes_before),
      status = case
        when new.starts_at - make_interval(mins => rem.minutes_before) > now()
          then 'scheduled'
        else 'cancelled'
      end
    where rem.appointment_id = new.id
      and rem.status = 'scheduled';
  end if;

  return new;
end;
$$;

comment on function public.notify_patient_appointment_rescheduled() is
  'Patient reschedule alert. Ignores starts_at bumps during in_progress station handoffs.';
