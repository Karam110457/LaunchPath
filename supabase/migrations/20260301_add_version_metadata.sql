-- Add user-provided labels and knowledge snapshot to agent versions
alter table public.agent_versions add column if not exists change_title text;
alter table public.agent_versions add column if not exists change_description text;
alter table public.agent_versions add column if not exists knowledge_snapshot jsonb default '[]';
