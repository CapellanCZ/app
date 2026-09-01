-- Soft-archive notifications (Clear all) instead of hard delete.
-- Rows stay in DB for audit/push history; inbox queries filter archived_at is null.

alter table public.notifications
  add column if not exists archived_at timestamptz;

create index if not exists notifications_user_active_created_idx
  on public.notifications (user_id, created_at desc)
  where archived_at is null;
