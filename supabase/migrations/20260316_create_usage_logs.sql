-- Usage logs: tracks every runtime LLM call with cost and credit data
create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id uuid references ai_agents(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  conversation_id uuid,
  model text not null,
  model_tier text not null check (model_tier in ('fast', 'standard', 'advanced')),
  credits_consumed int not null default 0,
  input_tokens int,
  output_tokens int,
  openrouter_generation_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

-- Indexes for analytics queries
create index idx_usage_logs_user_created on usage_logs(user_id, created_at);
create index idx_usage_logs_client on usage_logs(client_id, created_at);
create index idx_usage_logs_agent on usage_logs(agent_id, created_at);

-- RLS
alter table usage_logs enable row level security;

create policy "Users can read own usage"
  on usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on usage_logs for insert
  with check (auth.uid() = user_id);
