/**
 * Offer agent — generates transformation copy + guarantee text.
 * Wraps OFFER_SYSTEM_PROMPT as a Mastra Agent with structured output.
 */

import { Agent } from "@mastra/core/agent";
import { OFFER_SYSTEM_PROMPT } from "@/lib/ai/offer-prompt";

export const offerAgent = new Agent({
  id: "offer",
  name: "Offer Builder",
  instructions: OFFER_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
