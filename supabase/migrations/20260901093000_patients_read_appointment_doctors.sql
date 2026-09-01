-- Patients can read provider profiles tied to their own appointments
-- (covers inactive doctors who no longer appear in the bookable staff list).
create policy users_select_appointment_doctors_for_patients
  on public.users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.appointments a
      join public.patients p on p.id = a.patient_id
      where a.doctor_id = users.id
        and p.auth_user_id = auth.uid()
    )
  );
