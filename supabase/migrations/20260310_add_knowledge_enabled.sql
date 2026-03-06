-- Add knowledge_enabled flag to ai_agents.
-- When true, the knowledge base node appears on the canvas.
-- Users explicitly add/remove knowledge via the tool catalog.

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS knowledge_enabled BOOLEAN NOT NULL DEFAULT false;

-- Backfill: enable for agents that already have knowledge documents
UPDATE public.ai_agents a
SET knowledge_enabled = true
WHERE EXISTS (
  SELECT 1 FROM public.agent_knowledge_documents d WHERE d.agent_id = a.id
);
