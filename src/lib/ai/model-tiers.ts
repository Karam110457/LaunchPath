/**
 * Model definitions with multiplier-based credit pricing.
 *
 * Each model has a multiplier that determines credit cost based on actual
 * token usage: credits = round(totalTokens / 1000 × multiplier, 2), min 0.01.
 *
 * The multiplier reflects relative model cost. 1.0x baseline = GPT-4o.
 * Multipliers derived from blended token pricing (70% input + 30% output).
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
  /** Credit multiplier — credits = round(totalTokens / 1000 × multiplier, 2) */
  multiplier: number;
}

/** Tier display labels */
export const TIER_LABELS: Record<ModelTier, string> = {
  fast: "Fast",
  standard: "Standard",
  advanced: "Advanced",
};

/** All provider names for UI filtering */
export const PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Meta",
  "Mistral",
  "DeepSeek",
  "Qwen",
  "Amazon",
  "Cohere",
  "xAI",
] as const;

export type Provider = (typeof PROVIDERS)[number];

/**
 * All available runtime models.
 *
 * Models prefixed with a provider slug (e.g. "openai/") are routed through
 * OpenRouter. Bare Anthropic IDs (e.g. "claude-*") go direct to Anthropic.
 */
export const MODEL_OPTIONS: ModelOption[] = [
  // ---------------------------------------------------------------------------
  // OpenAI
  // ---------------------------------------------------------------------------
  // Fast
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tier: "fast", multiplier: 0.05 },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI", tier: "fast", multiplier: 0.07 },
  { value: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "OpenAI", tier: "fast", multiplier: 0.03 },
  // Standard
  { value: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tier: "standard", multiplier: 1.0 },
  { value: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI", tier: "standard", multiplier: 0.8 },
  { value: "openai/gpt-5.2", label: "GPT-5.2", provider: "OpenAI", tier: "standard", multiplier: 1.4 },
  { value: "openai/gpt-5.2-chat", label: "GPT-5.2 Chat", provider: "OpenAI", tier: "standard", multiplier: 1.4 },
  { value: "openai/gpt-5.3-chat", label: "GPT-5.3 Chat", provider: "OpenAI", tier: "standard", multiplier: 1.5 },
  { value: "openai/gpt-5.4", label: "GPT-5.4", provider: "OpenAI", tier: "standard", multiplier: 1.8 },
  // Advanced
  { value: "openai/o3", label: "GPT o3", provider: "OpenAI", tier: "advanced", multiplier: 3.33 },
  { value: "openai/o3-mini", label: "GPT o3 Mini", provider: "OpenAI", tier: "standard", multiplier: 0.9 },
  { value: "openai/gpt-5.2-pro", label: "GPT-5.2 Pro", provider: "OpenAI", tier: "advanced", multiplier: 15.0 },
  { value: "openai/gpt-5.4-pro", label: "GPT-5.4 Pro", provider: "OpenAI", tier: "advanced", multiplier: 20.0 },
  // Codex
  { value: "openai/gpt-5.2-codex", label: "GPT-5.2 Codex", provider: "OpenAI", tier: "standard", multiplier: 1.4 },
  { value: "openai/gpt-5.3-codex", label: "GPT-5.3 Codex", provider: "OpenAI", tier: "standard", multiplier: 1.5 },

  // ---------------------------------------------------------------------------
  // Anthropic
  // ---------------------------------------------------------------------------
  // Fast (direct)
  { value: "claude-haiku-3-5-20241022", label: "Claude Haiku 3.5", provider: "Anthropic", tier: "fast", multiplier: 0.1 },
  // Standard (direct)
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", provider: "Anthropic", tier: "standard", multiplier: 1.5 },
  // Standard (via OpenRouter — newer)
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", provider: "Anthropic", tier: "standard", multiplier: 1.7 },
  // Advanced
  { value: "anthropic/claude-opus-4", label: "Claude Opus 4", provider: "Anthropic", tier: "advanced", multiplier: 3.33 },
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6", provider: "Anthropic", tier: "advanced", multiplier: 3.6 },

  // ---------------------------------------------------------------------------
  // Google
  // ---------------------------------------------------------------------------
  // Fast
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", provider: "Google", tier: "fast", multiplier: 0.04 },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tier: "fast", multiplier: 0.15 },
  { value: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", provider: "Google", tier: "fast", multiplier: 0.08 },
  // Standard
  { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro", provider: "Google", tier: "standard", multiplier: 1.6 },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "Google", tier: "standard", multiplier: 1.8 },

  // ---------------------------------------------------------------------------
  // Meta (Llama)
  // ---------------------------------------------------------------------------
  // Fast
  { value: "meta-llama/llama-3.3-8b-instruct", label: "Llama 3.3 8B", provider: "Meta", tier: "fast", multiplier: 0.02 },
  { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout", provider: "Meta", tier: "fast", multiplier: 0.05 },
  // Standard
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", provider: "Meta", tier: "standard", multiplier: 0.35 },
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", provider: "Meta", tier: "standard", multiplier: 0.4 },
  // Advanced
  { value: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", provider: "Meta", tier: "advanced", multiplier: 1.2 },

  // ---------------------------------------------------------------------------
  // Mistral
  // ---------------------------------------------------------------------------
  // Fast
  { value: "mistralai/ministral-3b-2512", label: "Ministral 3B", provider: "Mistral", tier: "fast", multiplier: 0.02 },
  { value: "mistralai/ministral-8b-2512", label: "Ministral 8B", provider: "Mistral", tier: "fast", multiplier: 0.02 },
  { value: "mistralai/mistral-small-creative", label: "Mistral Small Creative", provider: "Mistral", tier: "fast", multiplier: 0.02 },
  // Standard
  { value: "mistralai/ministral-14b-2512", label: "Ministral 14B", provider: "Mistral", tier: "standard", multiplier: 0.03 },
  { value: "mistralai/mistral-large-2512", label: "Mistral Large 3", provider: "Mistral", tier: "standard", multiplier: 0.15 },
  { value: "mistralai/devstral-2512", label: "Devstral 2", provider: "Mistral", tier: "standard", multiplier: 0.35 },

  // ---------------------------------------------------------------------------
  // DeepSeek
  // ---------------------------------------------------------------------------
  // Fast
  { value: "deepseek/deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek", tier: "fast", multiplier: 0.06 },
  // Standard
  { value: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek", tier: "standard", multiplier: 0.06 },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek", tier: "standard", multiplier: 0.35 },
  { value: "deepseek/deepseek-v3.2-speciale", label: "DeepSeek V3.2 Speciale", provider: "DeepSeek", tier: "standard", multiplier: 0.12 },

  // ---------------------------------------------------------------------------
  // Qwen
  // ---------------------------------------------------------------------------
  // Fast
  { value: "qwen/qwen3.5-9b", label: "Qwen 3.5 9B", provider: "Qwen", tier: "fast", multiplier: 0.02 },
  { value: "qwen/qwen3.5-flash-02-23", label: "Qwen 3.5 Flash", provider: "Qwen", tier: "fast", multiplier: 0.03 },
  // Standard
  { value: "qwen/qwen3.5-27b", label: "Qwen 3.5 27B", provider: "Qwen", tier: "standard", multiplier: 0.1 },
  { value: "qwen/qwen3.5-plus-02-15", label: "Qwen 3.5 Plus", provider: "Qwen", tier: "standard", multiplier: 0.1 },
  { value: "qwen/qwen3.5-122b-a10b", label: "Qwen 3.5 122B MoE", provider: "Qwen", tier: "standard", multiplier: 0.12 },
  { value: "qwen/qwen3.5-397b-a17b", label: "Qwen 3.5 397B MoE", provider: "Qwen", tier: "standard", multiplier: 0.18 },
  // Advanced
  { value: "qwen/qwen3-max-thinking", label: "Qwen 3 Max Thinking", provider: "Qwen", tier: "advanced", multiplier: 0.6 },

  // ---------------------------------------------------------------------------
  // Amazon
  // ---------------------------------------------------------------------------
  { value: "amazon/nova-2-lite-v1", label: "Nova 2 Lite", provider: "Amazon", tier: "fast", multiplier: 0.1 },

  // ---------------------------------------------------------------------------
  // Cohere
  // ---------------------------------------------------------------------------
  { value: "cohere/command-r-plus", label: "Command R+", provider: "Cohere", tier: "standard", multiplier: 0.5 },
  { value: "cohere/command-r", label: "Command R", provider: "Cohere", tier: "fast", multiplier: 0.08 },

  // ---------------------------------------------------------------------------
  // xAI
  // ---------------------------------------------------------------------------
  { value: "x-ai/grok-2", label: "Grok 2", provider: "xAI", tier: "standard", multiplier: 0.6 },
  { value: "x-ai/grok-3-mini-beta", label: "Grok 3 Mini", provider: "xAI", tier: "standard", multiplier: 0.5 },
  { value: "x-ai/grok-3-beta", label: "Grok 3", provider: "xAI", tier: "advanced", multiplier: 1.5 },
];

/** Default model for new agents */
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

/** Get unique providers from MODEL_OPTIONS */
export function getAvailableProviders(): string[] {
  return [...new Set(MODEL_OPTIONS.map((m) => m.provider))];
}

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
