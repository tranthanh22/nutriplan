-- Store versioned AI explanations separately from deterministic nutrition metrics.
-- Only the trusted backend may generate/read full insights; clients use NestJS APIs.

create table if not exists public.ai_health_insights (
  id uuid primary key default gen_random_uuid(),
  nutrition_profile_id uuid not null
    references public.nutrition_profiles(id) on delete cascade,
  provider text not null default 'openai',
  model text not null,
  prompt_version text not null,
  formula_version text not null,
  input_fingerprint text not null,
  input_data jsonb not null,
  output_data jsonb,
  preview_summary text,
  status text not null default 'pending',
  safety_status text not null default 'pending',
  input_tokens integer,
  output_tokens integer,
  estimated_cost_micros bigint,
  error_code text,
  error_message text,
  generated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_health_insights_idempotency unique (
    nutrition_profile_id,
    provider,
    model,
    prompt_version,
    input_fingerprint
  ),
  constraint ai_health_insights_input_object check (
    jsonb_typeof(input_data) = 'object'
  ),
  constraint ai_health_insights_output_object check (
    output_data is null or jsonb_typeof(output_data) = 'object'
  ),
  constraint ai_health_insights_status check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  constraint ai_health_insights_safety_status check (
    safety_status in ('pending', 'passed', 'review_required', 'blocked')
  ),
  constraint ai_health_insights_tokens_nonnegative check (
    coalesce(input_tokens, 0) >= 0 and coalesce(output_tokens, 0) >= 0
  ),
  constraint ai_health_insights_cost_nonnegative check (
    coalesce(estimated_cost_micros, 0) >= 0
  ),
  constraint ai_health_insights_completed_output check (
    status <> 'completed'
    or (output_data is not null and generated_at is not null)
  )
);

create index if not exists ai_health_insights_profile_created_idx
  on public.ai_health_insights(nutrition_profile_id, created_at desc);

create index if not exists ai_health_insights_pending_idx
  on public.ai_health_insights(status, created_at)
  where status in ('pending', 'processing');

alter table public.ai_health_insights enable row level security;

-- Full AI input/output stays behind NestJS. Do not expose this table to browsers.
revoke all on table public.ai_health_insights from anon, authenticated;
grant select, insert, update, delete on table public.ai_health_insights to service_role;

create trigger set_ai_health_insights_updated_at
  before update on public.ai_health_insights
  for each row execute function public.set_updated_at();

comment on table public.ai_health_insights is
  'AI-generated explanations of deterministic nutrition metrics; not medical diagnoses.';

comment on column public.ai_health_insights.input_data is
  'Minimal pseudonymous input sent to the AI provider; exclude direct identifiers.';

comment on column public.ai_health_insights.output_data is
  'Structured output validated by the NestJS JSON Schema before persistence.';
