-- Agent Tools: external integrations and internal capabilities attached to an agent.
-- Each row represents one configured tool instance for a specific agent.

CREATE TABLE public.agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tool type determines which executor to use
  tool_type TEXT NOT NULL CHECK (tool_type IN (
    'calendly',
    'ghl',
    'hubspot',
    'human-handoff',
    'webhook',
    'mcp'
  )),

  -- User-visible label (e.g. "Book a Call", "GoHighLevel CRM")
  display_name TEXT NOT NULL,

  -- Claude-facing description — tells the agent when/how to use this tool
  description TEXT NOT NULL,

  -- Tool-specific configuration (API keys, URLs, settings)
  -- Shape varies by tool_type — see src/lib/tools/types.ts for per-type schemas
  config JSONB NOT NULL DEFAULT '{}',

  -- Soft toggle — disabled tools are not passed to Claude but config is preserved
  is_enabled BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE TRIGGER agent_tools_updated_at
  BEFORE UPDATE ON public.agent_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fast lookup by agent
CREATE INDEX idx_agent_tools_agent_id ON public.agent_tools(agent_id);
CREATE INDEX idx_agent_tools_user_id ON public.agent_tools(user_id);

-- Row Level Security
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent tools"
  ON public.agent_tools FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent tools"
  ON public.agent_tools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent tools"
  ON public.agent_tools FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent tools"
  ON public.agent_tools FOR DELETE
  USING (auth.uid() = user_id);
