import { Agent } from "@mastra/core/agent";
import { AGENT_BUILDER_SYSTEM_PROMPT } from "@/lib/ai/agent-builder-prompt";

export const agentBuilderAgent = new Agent({
  id: "agent-builder",
  name: "Agent Builder",
  instructions: AGENT_BUILDER_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
