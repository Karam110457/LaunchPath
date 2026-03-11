/**
 * Model tier definitions and utilities.
 *
 * Maps model IDs to tiers (fast / standard / advanced) with credit costs.
 * Used by both the UI (showing credit cost per model) and backend (deducting credits).
 */

export type ModelTier = "fast" | "standard" | "advanced";

export interface ModelOption {
  /** Model ID sent to the provider (e.g. "openai/gpt-4o-mini") */
  value: string;
  /** Human-readable label */
  label: string;
  /** Provider for display grouping */
  provider: string;
  /** Tier determines credit cost */
  tier: ModelTier;
}

/** Credits consumed per message by tier */
export const CREDITS_PER_TIER: Record<ModelTier, number> = {
  fast: 1,
  standard: 5,
  advanced: 20,
};

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
  // Fast tier (1 credit/msg)
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    tier: "fast",
  },
  {
    value: "claude-haiku-3-5-20241022",
    label: "Claude Haiku 3.5",
    provider: "Anthropic",
    tier: "fast",
  },
  {
    value: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    tier: "fast",
  },

  // Standard tier (5 credits/msg)
  {
    value: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    tier: "standard",
  },
  {
    value: "claude-sonnet-4-5-20250929",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    tier: "standard",
  },
  {
    value: "google/gemini-2.5-pro-preview",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    tier: "standard",
  },

  // Advanced tier (20 credits/msg)
  {
    value: "anthropic/claude-opus-4",
    label: "Claude Opus 4",
    provider: "Anthropic",
    tier: "advanced",
  },
  {
    value: "openai/o3",
    label: "GPT o3",
    provider: "OpenAI",
    tier: "advanced",
  },
];

/** Default model for new agents */
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

/**
 * Look up a model's tier. Falls back to "standard" for unknown models
 * (e.g. if a model ID in the DB predates this mapping).
 */
export function getModelTier(modelId: string): ModelTier {
  const match = MODEL_OPTIONS.find((m) => m.value === modelId);
  return match?.tier ?? "standard";
}

/**
 * Get credit cost for a model.
 */
export function getModelCredits(modelId: string): number {
  return CREDITS_PER_TIER[getModelTier(modelId)];
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
