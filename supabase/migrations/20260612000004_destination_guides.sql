-- Cached LLM-generated practical guides, one row per normalized destination.
create table if not exists public.destination_guides (
  id uuid primary key default gen_random_uuid(),
  destination_key text not null unique,
  destination text not null,
  guide jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

alter table public.destination_guides enable row level security;

-- Accessed exclusively through the service-role client in API routes.
grant select, insert, update, delete on public.destination_guides to service_role;
