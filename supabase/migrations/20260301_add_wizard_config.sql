-- Store the original wizard configuration for future editing
alter table public.ai_agents add column if not exists wizard_config jsonb default null;
