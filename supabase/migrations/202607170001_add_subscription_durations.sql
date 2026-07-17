-- Add duration-based subscription plans for an existing NutriPlan database.
-- Fresh databases already receive these values from the initial migration.

alter type public.billing_interval add value if not exists 'day';

alter table public.subscription_plans
  alter column billing_interval set default 'month';

