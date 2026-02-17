/**
 * Guarantee agent — generates niche-specific, achievable guarantees.
 * Used in the offer-generation workflow (parallel step).
 */

import { Agent } from "@mastra/core/agent";
import { GUARANTEE_SYSTEM_PROMPT } from "@/lib/ai/guarantee-prompt";

export const guaranteeAgent = new Agent({
  id: "guarantee",
  name: "Guarantee Specialist",
  instructions: GUARANTEE_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
