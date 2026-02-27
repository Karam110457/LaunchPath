-- Create agent_conversations table for agent test chat persistence
create table if not exists public.agent_conversations (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.ai_agents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  messages jsonb default '[]' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.agent_conversations enable row level security;

-- Users can read their own conversations
create policy "Users can read own agent conversations"
  on public.agent_conversations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own conversations
create policy "Users can insert own agent conversations"
  on public.agent_conversations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own conversations
create policy "Users can update own agent conversations"
  on public.agent_conversations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own conversations
create policy "Users can delete own agent conversations"
  on public.agent_conversations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Reuse the updated_at trigger function
create trigger on_agent_conversations_updated
  before update on public.agent_conversations
  for each row
  execute function public.handle_updated_at();

-- Index for fast lookup by agent
create index idx_agent_conversations_agent_id on public.agent_conversations(agent_id);

-- Index for fast lookup by user
create index idx_agent_conversations_user_id on public.agent_conversations(user_id);

-- One conversation per agent per user (v1 single-conversation model)
create unique index idx_agent_conversations_unique_agent
  on public.agent_conversations(agent_id, user_id);
