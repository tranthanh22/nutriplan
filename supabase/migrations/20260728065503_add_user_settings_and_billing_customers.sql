create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  assistant_name text not null default 'Nutri',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_assistant_name_length
    check (char_length(btrim(assistant_name)) between 2 and 32)
);

create table if not exists public.billing_customers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_provider check (provider = 'stripe'),
  constraint billing_customers_provider_reference_unique
    unique (provider, provider_customer_id)
);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists billing_customers_set_updated_at
  on public.billing_customers;
create trigger billing_customers_set_updated_at
  before update on public.billing_customers
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;
alter table public.billing_customers enable row level security;

drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own
  on public.user_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own
  on public.user_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own
  on public.user_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists billing_customers_select_own
  on public.billing_customers;
create policy billing_customers_select_own
  on public.billing_customers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.user_settings from anon;
revoke all on table public.billing_customers from anon;
grant select, insert, update on table public.user_settings to authenticated;
grant select on table public.billing_customers to authenticated;
grant select, insert, update, delete on table public.user_settings to service_role;
grant select, insert, update, delete on table public.billing_customers to service_role;
