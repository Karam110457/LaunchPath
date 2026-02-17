/**
 * Pricing agent — generates AI-informed pricing for the offer.
 * Replaces the hardcoded calculatePricing() switch statement.
 * Used in the offer-generation workflow (parallel step).
 */

import { Agent } from "@mastra/core/agent";
import { PRICING_SYSTEM_PROMPT } from "@/lib/ai/pricing-prompt";

export const pricingAgent = new Agent({
  id: "pricing",
  name: "Pricing Strategist",
  instructions: PRICING_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
