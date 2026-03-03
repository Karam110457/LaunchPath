-- Update agent_tools tool_type CHECK constraint.
-- Removed legacy types: calendly, ghl, hubspot, human-handoff.
-- Current types: webhook, mcp, composio.

ALTER TABLE public.agent_tools
  DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;

ALTER TABLE public.agent_tools
  ADD CONSTRAINT agent_tools_tool_type_check
  CHECK (tool_type IN (
    'webhook',
    'mcp',
    'composio'
  ));
