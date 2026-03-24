create table public.itinerary_versions (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  version_number integer not null,
  parent_version_id uuid references public.itinerary_versions(id) on delete set null,
  snapshot jsonb not null,
  source text not null default 'generate',
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint itinerary_versions_trip_version_unique unique (trip_id, version_number)
);

create table public.adaptation_events (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_version_id uuid references public.itinerary_versions(id) on delete set null,
  to_version_id uuid not null references public.itinerary_versions(id) on delete cascade,
  source text not null default 'manual',
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.itinerary_versions enable row level security;
alter table public.adaptation_events enable row level security;

create policy "Users can manage own itinerary versions"
  on public.itinerary_versions
  for all
  using (trip_id in (select id from public.trips where user_id = auth.uid()));

create policy "Users can manage own adaptation events"
  on public.adaptation_events
  for all
  using (trip_id in (select id from public.trips where user_id = auth.uid()));

create index idx_itinerary_versions_trip on public.itinerary_versions(trip_id, version_number desc);
create index idx_adaptation_events_trip on public.adaptation_events(trip_id, created_at desc);
create index idx_adaptation_events_to_version on public.adaptation_events(to_version_id);
