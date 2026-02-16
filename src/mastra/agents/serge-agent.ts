/**
 * Serge agent — niche analysis using the Serge framework.
 * Wraps SERGE_SYSTEM_PROMPT as a Mastra Agent with structured output.
 */

import { Agent } from "@mastra/core/agent";
import { SERGE_SYSTEM_PROMPT } from "@/lib/ai/serge-prompt";

export const sergeAgent = new Agent({
  id: "serge",
  name: "Serge — Niche Analyst",
  instructions: SERGE_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
