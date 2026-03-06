-- Add parent_agent_id to support child (sub) agents on the canvas.
-- Child agents are full ai_agents rows with their own tools, knowledge, etc.
-- ON DELETE CASCADE: deleting the parent removes all children automatically.

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ai_agents_parent_id
  ON public.ai_agents(parent_agent_id)
  WHERE parent_agent_id IS NOT NULL;
