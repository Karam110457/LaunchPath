/**
 * Demo page agents — one Mastra Agent per niche.
 * Each wraps the system prompt from the registry and uses structured output.
 */

import { Agent } from "@mastra/core/agent";
import { NICHE_AGENTS } from "@/lib/ai/agents/registry";

const MODEL = "anthropic/claude-sonnet-4-5-20250929";

/**
 * Build a Record of demo agents keyed by `demo-{slug}`.
 * Example: { "demo-roofing": Agent, "demo-window_cleaning": Agent, ... }
 */
export const demoAgents: Record<string, Agent> = Object.fromEntries(
  Object.entries(NICHE_AGENTS).map(([slug, config]) => [
    `demo-${slug}`,
    new Agent({
      id: `demo-${slug}`,
      name: config.name,
      instructions: config.systemPrompt,
      model: MODEL,
    }),
  ])
);
