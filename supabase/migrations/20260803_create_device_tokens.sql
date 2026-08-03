-- Push tokens table (was in 20260423_notifications.sql but missing on remote).
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
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.device_tokens to authenticated;
