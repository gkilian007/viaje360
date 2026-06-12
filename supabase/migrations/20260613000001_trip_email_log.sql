-- Idempotency log for per-trip transactional emails (check-in reminder, etc.).
-- The unique constraint guarantees each email type is sent at most once per trip.
create table if not exists public.trip_email_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  email_type text not null,
  sent_at timestamptz not null default now(),
  unique (trip_id, email_type)
);

alter table public.trip_email_log enable row level security;

-- Accessed exclusively through the service-role client in the cron route.
grant select, insert, update, delete on public.trip_email_log to service_role;
