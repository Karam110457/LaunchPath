-- Multi-conversation support: allow multiple test conversations per agent per user.

-- Drop the v1 unique constraint (one conversation per agent per user)
DROP INDEX IF EXISTS idx_agent_conversations_unique_agent;

-- Add title column for auto-titling conversations
ALTER TABLE public.agent_conversations
  ADD COLUMN IF NOT EXISTS title text;

-- Composite index for listing conversations by agent+user, ordered by recency
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_user_updated
  ON public.agent_conversations(agent_id, user_id, updated_at DESC);
