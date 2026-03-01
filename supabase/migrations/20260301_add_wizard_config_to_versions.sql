-- Add wizard_config to agent_versions so it can be snapshot and reverted
alter table public.agent_versions add column if not exists wizard_config jsonb default null;
