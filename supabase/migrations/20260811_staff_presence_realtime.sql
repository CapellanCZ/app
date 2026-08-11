-- Enable realtime for tables that drive School Doctors presence (break toggles + schedule).

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'staff_break_status'
  ) then
    alter publication supabase_realtime add table public.staff_break_status;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clinic_break_status'
  ) then
    alter publication supabase_realtime add table public.clinic_break_status;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'doctor_availability'
  ) then
    alter publication supabase_realtime add table public.doctor_availability;
  end if;
end
$$;
