-- Monetization tables: subscriptions, destination purchases, destination trials

-- User subscriptions (annual plan)
create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('free', 'annual')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  stripe_subscription_id text,
  stripe_customer_id text,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Destination purchases (one-time per destination)
create table public.destination_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination text not null,
  stripe_payment_intent_id text,
  amount numeric not null default 4.99,
  currency text not null default 'EUR',
  purchased_at timestamptz not null default now(),
  created_at timestamptz default now()
);
create unique index idx_destination_purchases_user_dest
  on public.destination_purchases(user_id, lower(trim(destination)));

-- Destination trials (2-day trial per destination)
create table public.destination_trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination text not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
create unique index idx_destination_trials_user_dest
  on public.destination_trials(user_id, lower(trim(destination)));

-- RLS
alter table public.user_subscriptions enable row level security;
alter table public.destination_purchases enable row level security;
alter table public.destination_trials enable row level security;

-- Service role access
create policy "service_role_all" on public.user_subscriptions for all
  using (true) with check (true);
create policy "service_role_all" on public.destination_purchases for all
  using (true) with check (true);
create policy "service_role_all" on public.destination_trials for all
  using (true) with check (true);

-- Grant
grant all on public.user_subscriptions to service_role;
grant all on public.destination_purchases to service_role;
grant all on public.destination_trials to service_role;
