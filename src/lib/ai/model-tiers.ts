/**
 * Model definitions with multiplier-based credit pricing.
 *
 * Each model has a multiplier that determines credit cost based on actual
 * token usage: credits = round(totalTokens / 1000 × multiplier, 2), min 0.01.
 *
 * The multiplier reflects relative model cost. 1.0x baseline = GPT-4o.
 * Cheaper models (0.05x–0.10x) burn fractional credits; expensive models
 * (3.33x) burn several credits per message.
 */

export type ModelTier = "fast" | "standard" | "advanced";

export interface ModelOption {
  /** Model ID sent to the provider (e.g. "openai/gpt-4o-mini") */
  value: string;
  /** Human-readable label */
  label: string;
  /** Provider for display grouping */
  provider: string;
  /** Display tier (fast / standard / advanced) — for UI grouping only */
  tier: ModelTier;
  /** Credit multiplier — credits = ceil(totalTokens / 1000 × multiplier) */
  multiplier: number;
}

/** Tier display labels */
export const TIER_LABELS: Record<ModelTier, string> = {
  fast: "Fast",
  standard: "Standard",
  advanced: "Advanced",
};

/**
 * All available runtime models.
 *
 * Models prefixed with a provider slug (e.g. "openai/") are routed through
 * OpenRouter. Bare Anthropic IDs (e.g. "claude-*") go direct to Anthropic.
 */
export const MODEL_OPTIONS: ModelOption[] = [
  // Fast tier — cheap, high-speed models
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    tier: "fast",
    multiplier: 0.07,
  },
  {
    value: "claude-haiku-3-5-20241022",
    label: "Claude Haiku 3.5",
    provider: "Anthropic",
    tier: "fast",
    multiplier: 0.1,
  },
  {
    value: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    tier: "fast",
    multiplier: 0.05,
  },

  // Standard tier — balanced quality and cost
  {
    value: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    tier: "standard",
    multiplier: 1.0,
  },
  {
    value: "claude-sonnet-4-5-20250929",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    tier: "standard",
    multiplier: 1.5,
  },
  {
    value: "google/gemini-2.5-pro-preview",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    tier: "standard",
    multiplier: 1.6,
  },

  // Advanced tier — most capable, highest cost
  {
    value: "anthropic/claude-opus-4",
    label: "Claude Opus 4",
    provider: "Anthropic",
    tier: "advanced",
    multiplier: 3.33,
  },
  {
    value: "openai/o3",
    label: "GPT o3",
    provider: "OpenAI",
    tier: "advanced",
    multiplier: 3.33,
  },
];

/** Default model for new agents */
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

/**
 * Look up a model's tier. Falls back to "standard" for unknown models.
 */
export function getModelTier(modelId: string): ModelTier {
  const match = MODEL_OPTIONS.find((m) => m.value === modelId);
  return match?.tier ?? "standard";
}

/**
 * Get a model's credit multiplier. Falls back to 1.0 for unknown models.
 */
export function getModelMultiplier(modelId: string): number {
  const match = MODEL_OPTIONS.find((m) => m.value === modelId);
  return match?.multiplier ?? 1.0;
}

/**
 * Calculate actual credits consumed from real token usage.
 * Formula: round(totalTokens / 1000 × multiplier, 2), minimum 0.01 credit.
 * Returns 1 if token counts are unavailable (fallback).
 */
export function calculateCredits(
  modelId: string,
  inputTokens: number | undefined,
  outputTokens: number | undefined
): number {
  const total = (inputTokens ?? 0) + (outputTokens ?? 0);
  if (total === 0) return 1; // Fallback when token count unavailable
  const multiplier = getModelMultiplier(modelId);
  return Math.max(0.01, Math.round((total / 1000) * multiplier * 100) / 100);
}

/**
 * Estimate credits for pre-flight check (before response).
 * Uses multiplier × 2 (assumes ~2K tokens for a typical exchange).
 * Minimum estimate of 0.01 credit.
 */
export function estimateCredits(modelId: string): number {
  const multiplier = getModelMultiplier(modelId);
  return Math.max(0.01, Math.round(multiplier * 2 * 100) / 100);
}

/**
 * Get display info for a model.
 */
export function getModelInfo(modelId: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.value === modelId);
}

/**
 * Check if a model ID should be routed through OpenRouter.
 * Bare Anthropic IDs (claude-*) go direct; everything else goes via OpenRouter.
 */
export function isOpenRouterModel(modelId: string): boolean {
  return modelId.includes("/");
}
