/**
 * Demo builder agent — generates complete demo page configurations.
 * Takes a user's offer + niche recommendation and produces form fields,
 * scoring rules, hero copy, and offer integration settings.
 * Includes quality processor for config validation.
 * Used in the demo-builder workflow.
 */

import { Agent } from "@mastra/core/agent";
import { DEMO_BUILDER_SYSTEM_PROMPT } from "@/lib/ai/demo-builder-prompt";
import { demoConfigQualityProcessor } from "@/lib/ai/processors/demo-config-quality";

export const demoBuilderAgent = new Agent({
  id: "demo-builder",
  name: "Demo Page Builder",
  instructions: DEMO_BUILDER_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
  outputProcessors: [demoConfigQualityProcessor],
});
