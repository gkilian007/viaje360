-- Savings metrics instrumentation.
-- generation_events records every itinerary generation (AI vs library reuse)
-- so the admin panel can compute reuse rates and estimated API savings.
create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  source_type text not null,
  score numeric,
  authenticated boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_generation_events_created_at
  on public.generation_events (created_at);

alter table public.generation_events enable row level security;

-- Written exclusively through the service-role client in the generate route.
grant select, insert on public.generation_events to service_role;

-- Track how often each places_cache entry is served instead of hitting a provider.
alter table public.places_cache
  add column if not exists hit_count integer not null default 0;

create or replace function public.increment_places_cache_hit(p_cache_key text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.places_cache
  set hit_count = hit_count + 1
  where cache_key = p_cache_key;
$$;
