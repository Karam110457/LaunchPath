/**
 * Unified model provider resolver.
 *
 * Returns the correct AI SDK provider instance based on the model ID:
 * - Bare Anthropic IDs (e.g. "claude-sonnet-4-5-20250929") → direct @ai-sdk/anthropic
 * - Slash-prefixed IDs (e.g. "openai/gpt-4o") → @openrouter/ai-sdk-provider
 *
 * This is the ONLY file that imports both providers. All runtime LLM calls
 * should use `getModel(modelId)` instead of importing providers directly.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { isOpenRouterModel } from "./model-tiers";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Resolve a model ID to a Vercel AI SDK provider instance.
 *
 * @param modelId - e.g. "claude-sonnet-4-5-20250929" or "openai/gpt-4o"
 * @returns A provider instance compatible with streamText / generateText
 */
export function getModel(modelId: string) {
  if (isOpenRouterModel(modelId)) {
    return openrouter(modelId);
  }
  return anthropic(modelId);
}
