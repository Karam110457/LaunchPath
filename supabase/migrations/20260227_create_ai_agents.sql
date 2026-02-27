-- Create ai_agents table for the Agent Builder feature
create table if not exists public.ai_agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  system_id uuid references public.user_systems(id) on delete set null,
  name text not null default 'Untitled Agent',
  description text,
  system_prompt text not null default '',
  personality jsonb default '{}',
  enabled_tools jsonb default '[]',
  knowledge_base jsonb default '{}',
  model text not null default 'claude-sonnet-4-5-20250929',
  template_id text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.ai_agents enable row level security;

-- Users can read their own agents
create policy "Users can read own agents"
  on public.ai_agents
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own agents
create policy "Users can insert own agents"
  on public.ai_agents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own agents
create policy "Users can update own agents"
  on public.ai_agents
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own agents
create policy "Users can delete own agents"
  on public.ai_agents
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Reuse the updated_at trigger function (already exists from user_profiles migration)
create trigger on_ai_agents_updated
  before update on public.ai_agents
  for each row
  execute function public.handle_updated_at();

-- Index for fast lookup by user
create index idx_ai_agents_user_id on public.ai_agents(user_id);

-- Index for optional system_id lookup
create index idx_ai_agents_system_id on public.ai_agents(system_id);
