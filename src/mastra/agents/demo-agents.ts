/**
 * Demo page agents — one Mastra Agent per niche.
 * Each wraps the system prompt from the registry and uses structured output.
 */

import { Agent } from "@mastra/core/agent";
import { NICHE_AGENTS, buildFallbackAgent } from "@/lib/ai/agents/registry";

export const MODEL = "anthropic/claude-sonnet-4-5-20250929";

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

/**
 * Get or create a demo agent for a given niche.
 * Falls back to a dynamically created agent for niches not in the registry.
 */
export function getDemoAgent(
  agentSlug: string | null,
  niche: string,
  solution?: string
): { agent: Agent; config: ReturnType<typeof buildFallbackAgent> } {
  if (agentSlug) {
    const existing = demoAgents[`demo-${agentSlug}`];
    const config = NICHE_AGENTS[agentSlug];
    if (existing && config) {
      return { agent: existing, config };
    }
  }

  // Fallback: create agent on-the-fly for unknown niches
  const fallbackConfig = buildFallbackAgent(niche, solution);
  const fallbackAgent = new Agent({
    id: "demo-fallback",
    name: fallbackConfig.name,
    instructions: fallbackConfig.systemPrompt,
    model: MODEL,
  });

  return { agent: fallbackAgent, config: fallbackConfig };
}
