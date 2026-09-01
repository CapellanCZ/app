-- Per-user notification category preferences (Profile → Notifications toggles).

create table if not exists public.notification_preferences (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  appointments  boolean not null default true,
  announcements boolean not null default true,
  health        boolean not null default true,
  updated_at    timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.notification_preferences to authenticated;

create or replace function public.touch_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.touch_notification_preferences_updated_at();

comment on table public.notification_preferences is
  'Patient push/in-app notification opt-in per category (appointments, announcements, health alerts).';
