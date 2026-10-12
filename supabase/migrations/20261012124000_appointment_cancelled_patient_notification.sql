-- Patient inbox + push when an appointment is cancelled (works even if app is killed).
-- Replaces client-only notifySelf for cancel.

create or replace function public.notify_patient_appointment_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_doctor_name text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  if lower(new.status::text) <> 'cancelled' then
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

  -- One cancel notification per appointment.
  if exists (
    select 1
    from public.notifications n
    where n.user_id = v_user_id
      and n.metadata->>'appointment_id' = new.id::text
      and (
        n.metadata->>'event' = 'cancelled'
        or lower(n.title) = 'appointment cancelled'
      )
  ) then
    return new;
  end if;

  select u.full_name into v_doctor_name
  from public.users u
  where u.id = new.doctor_id;

  insert into public.notifications (user_id, type, title, body, href, metadata)
  values (
    v_user_id,
    'appointment',
    'Appointment Cancelled',
    format(
      'Your scheduled clinic visit with %s was cancelled. Book a new slot with a campus doctor anytime.',
      coalesce(nullif(trim(v_doctor_name), ''), 'a campus doctor')
    ),
    '/appointments',
    jsonb_build_object(
      'appointment_id', new.id,
      'category', 'health',
      'notification_type', 'error',
      'source', 'Health Service',
      'event', 'cancelled'
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_appointments_notify_cancelled on public.appointments;
create trigger trg_appointments_notify_cancelled
  after update of status
  on public.appointments
  for each row
  execute function public.notify_patient_appointment_cancelled();

comment on function public.notify_patient_appointment_cancelled() is
  'Inserts patient Appointment Cancelled notification (toast in-app via realtime, push via send-push).';
