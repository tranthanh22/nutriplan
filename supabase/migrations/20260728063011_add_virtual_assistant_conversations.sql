create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Cuộc trò chuyện mới',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_conversations_title_length
    check (char_length(title) between 1 and 120),
  constraint assistant_conversations_status
    check (status in ('active', 'archived'))
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  content text not null,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now(),
  constraint assistant_messages_role check (role in ('user', 'assistant')),
  constraint assistant_messages_content_length
    check (char_length(content) between 1 and 12000),
  constraint assistant_messages_input_tokens
    check (input_tokens is null or input_tokens >= 0),
  constraint assistant_messages_output_tokens
    check (output_tokens is null or output_tokens >= 0)
);

create index if not exists assistant_conversations_user_updated_idx
  on public.assistant_conversations(user_id, updated_at desc);

create index if not exists assistant_messages_conversation_created_idx
  on public.assistant_messages(conversation_id, created_at);

create index if not exists assistant_messages_user_idx
  on public.assistant_messages(user_id);

drop trigger if exists assistant_conversations_set_updated_at
  on public.assistant_conversations;
create trigger assistant_conversations_set_updated_at
  before update on public.assistant_conversations
  for each row execute function public.set_updated_at();

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

drop policy if exists assistant_conversations_select_own
  on public.assistant_conversations;
create policy assistant_conversations_select_own
  on public.assistant_conversations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists assistant_messages_select_own
  on public.assistant_messages;
create policy assistant_messages_select_own
  on public.assistant_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.assistant_conversations from anon;
revoke all on table public.assistant_messages from anon;
grant select on table public.assistant_conversations to authenticated;
grant select on table public.assistant_messages to authenticated;

