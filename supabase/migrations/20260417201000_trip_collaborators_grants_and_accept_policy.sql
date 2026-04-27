-- Fix trip_collaborators access for route handlers and authenticated invite acceptance

grant select, insert, update, delete on table public.trip_collaborators to authenticated;
grant select, insert, update, delete on table public.trip_collaborators to service_role;

drop policy if exists "Collaborators can accept their invitations" on public.trip_collaborators;
create policy "Collaborators can accept their invitations"
  on public.trip_collaborators for update
  using (
    email = (select email from auth.users where id = auth.uid())
  )
  with check (
    email = (select email from auth.users where id = auth.uid())
    and user_id = auth.uid()
  );
