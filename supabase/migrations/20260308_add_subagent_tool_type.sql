-- Add 'subagent' to the agent_tools tool_type CHECK constraint
ALTER TABLE public.agent_tools
  DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;

ALTER TABLE public.agent_tools
  ADD CONSTRAINT agent_tools_tool_type_check
  CHECK (tool_type IN (
    'calendly', 'ghl', 'hubspot', 'human-handoff',
    'webhook', 'mcp', 'composio', 'http', 'subagent'
  ));
