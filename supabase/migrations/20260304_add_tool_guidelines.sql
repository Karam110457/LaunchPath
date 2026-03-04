-- Add tool_guidelines column to ai_agents.
-- NULL = use auto-generated default guidelines.
-- Non-null = user has customized the guidelines text.
ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS tool_guidelines TEXT DEFAULT NULL;

-- Mirror in agent_versions so version snapshots capture it.
ALTER TABLE public.agent_versions
  ADD COLUMN IF NOT EXISTS tool_guidelines TEXT DEFAULT NULL;
