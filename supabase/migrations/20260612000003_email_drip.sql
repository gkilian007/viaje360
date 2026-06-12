-- Email drip queue: welcome → tips → nudge sequence for new signups.
-- Rows are enqueued by a trigger on auth.users and sent by /api/cron/unified
-- (daily, 07:00 UTC) via src/lib/services/email-drip.ts.

create table public.scheduled_drip_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default '',
  template text not null check (template in ('welcome', 'tips', 'nudge')),
  scheduled_at timestamptz not null,
  sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index scheduled_drip_emails_pending_idx
  on public.scheduled_drip_emails (scheduled_at)
  where sent = false;

-- RLS with no policies: only the service role (cron) reads or writes this table.
alter table public.scheduled_drip_emails enable row level security;

-- Tables created via the Management API don't get default privileges.
grant all on table public.scheduled_drip_emails to service_role;

create or replace function public.enqueue_drip_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  if new.email is null then
    return new;
  end if;

  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.scheduled_drip_emails (email, name, template, scheduled_at)
  values
    (new.email, display_name, 'welcome', now()),
    (new.email, display_name, 'tips', now() + interval '24 hours'),
    (new.email, display_name, 'nudge', now() + interval '72 hours');

  return new;
exception when others then
  -- Enqueueing marketing emails must never block a signup.
  raise warning 'enqueue_drip_emails failed for %: %', new.email, sqlerrm;
  return new;
end;
$$;

create trigger enqueue_drip_emails_after_signup
  after insert on auth.users
  for each row
  execute function public.enqueue_drip_emails();
