-- Agent versioning: snapshot agent state before each update
create table if not exists public.agent_versions (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.ai_agents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  version_number int not null,
  name text not null,
  description text,
  system_prompt text not null,
  personality jsonb not null default '{}',
  model text not null,
  status text not null,
  created_at timestamptz default now() not null
);

alter table public.agent_versions enable row level security;

create policy "Users can read own agent versions"
  on public.agent_versions for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own agent versions"
  on public.agent_versions for insert to authenticated
  with check (auth.uid() = user_id);

create index idx_agent_versions_agent on public.agent_versions(agent_id, version_number desc);
