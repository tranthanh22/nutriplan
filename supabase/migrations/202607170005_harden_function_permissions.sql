-- Supabase can grant EXECUTE to API roles through default function privileges.
-- Keep trigger functions private and expose only the RLS helpers each role needs.

revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.current_user_role() from public, anon, authenticated;
grant execute on function public.current_user_role() to authenticated;

revoke all on function public.has_active_subscription() from public, anon, authenticated;
grant execute on function public.has_active_subscription() to authenticated;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

revoke all on function public.is_kitchen_member(uuid) from public, anon, authenticated;
grant execute on function public.is_kitchen_member(uuid) to anon, authenticated;
