-- One active appointment per patient per clinic day (Asia/Manila).
-- Active = pending | confirmed | rescheduled | in_progress.
-- Cancelled / no_show / completed do not block a new booking that day.

-- Resolve existing duplicates before the unique index can be created:
-- keep the earliest start (then earliest created), cancel the rest.
with ranked as (
  select
    id,
    row_number() over (
      partition by patient_id, (starts_at at time zone 'Asia/Manila')::date
      order by starts_at asc, created_at asc, id asc
    ) as rn
  from public.appointments
  where status in ('pending', 'confirmed', 'rescheduled', 'in_progress')
)
update public.appointments a
set status = 'cancelled'
from ranked r
where a.id = r.id
  and r.rn > 1;

-- Cancel any scheduled reminders tied to those just-cancelled rows.
update public.appointment_reminders rem
set status = 'cancelled'
where rem.status = 'scheduled'
  and exists (
    select 1
    from public.appointments a
    where a.id = rem.appointment_id
      and a.status = 'cancelled'
  );

create unique index if not exists appointments_one_active_per_patient_day
  on public.appointments (
    patient_id,
    ((starts_at at time zone 'Asia/Manila')::date)
  )
  where status in ('pending', 'confirmed', 'rescheduled', 'in_progress');
