-- Weight tracking is part of the health profile and is available to every signed-in user.
-- A user can still only write rows that belong to their own auth.uid().
drop policy if exists progress_entries_subscriber_insert on public.progress_entries;
drop policy if exists progress_entries_subscriber_update on public.progress_entries;
drop policy if exists progress_entries_owner_insert on public.progress_entries;
drop policy if exists progress_entries_owner_update on public.progress_entries;

create policy progress_entries_owner_insert
  on public.progress_entries for insert
  to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy progress_entries_owner_update
  on public.progress_entries for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());
