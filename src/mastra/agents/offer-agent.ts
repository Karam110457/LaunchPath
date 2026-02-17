/**
 * Offer agent — generates transformation copy + system description.
 * Wraps OFFER_SYSTEM_PROMPT as a Mastra Agent with structured output.
 * Includes quality output processor for validation.
 */

import { Agent } from "@mastra/core/agent";
import { OFFER_SYSTEM_PROMPT } from "@/lib/ai/offer-prompt";
import { offerQualityProcessor } from "@/lib/ai/processors/offer-quality";

export const offerAgent = new Agent({
  id: "offer",
  name: "Offer Builder",
  instructions: OFFER_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
  outputProcessors: [offerQualityProcessor],
});
