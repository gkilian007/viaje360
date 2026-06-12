-- Closed beta: email allowlist + waitlist
-- Signups (email + OAuth) are blocked at the database level unless the email
-- is present in beta_invites. Existing users are unaffected (INSERT-only trigger).

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by text,
  created_at timestamptz not null default now()
);

create unique index if not exists beta_invites_email_lower_idx
  on public.beta_invites (lower(email));

-- Service-role only: RLS enabled with no policies
alter table public.beta_invites enable row level security;

create table if not exists public.beta_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists beta_waitlist_email_lower_idx
  on public.beta_waitlist (lower(email));

alter table public.beta_waitlist enable row level security;

-- Tables created outside the postgres role miss default privileges;
-- grant explicitly so the service-role API client can read/write.
grant select, insert, update, delete on table public.beta_invites to service_role;
grant select, insert, update, delete on table public.beta_waitlist to service_role;

-- Trigger: reject non-invited signups before the auth.users row exists.
-- Null emails (anonymous sign-ins) pass through.
create or replace function public.enforce_beta_invite()
returns trigger as $$
begin
  if new.email is null then
    return new;
  end if;
  if not exists (
    select 1 from public.beta_invites where lower(email) = lower(new.email)
  ) then
    raise exception 'beta_closed';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_beta_invite_before_signup
  before insert on auth.users
  for each row execute function public.enforce_beta_invite();

insert into public.beta_invites (email, invited_by)
values ('paeltuyo@gmail.com', 'seed')
on conflict do nothing;
