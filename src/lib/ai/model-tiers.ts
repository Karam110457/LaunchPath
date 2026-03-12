/**
 * Model definitions with multiplier-based credit pricing.
 *
 * Each model has a multiplier that determines credit cost based on actual
 * token usage: credits = round(totalTokens / 1000 × multiplier, 2), min 0.01.
 *
 * The multiplier reflects relative model cost. 1.0x baseline = GPT-4o ($4.75/M blended).
 * Multipliers derived from blended token pricing (70% input + 30% output)
 * using real OpenRouter/provider API prices as of March 2026.
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
  "MiniMax",
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
  // OpenAI — prices from openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tier: "fast", multiplier: 0.06 },       // $0.15/$0.60 → $0.29 blended
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI", tier: "fast", multiplier: 0.16 },      // $0.40/$1.60 → $0.76 blended
  { value: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "OpenAI", tier: "fast", multiplier: 0.04 },      // $0.10/$0.40 → $0.19 blended
  // Standard
  { value: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tier: "standard", multiplier: 1.0 },               // $2.50/$10 → $4.75 blended (BASELINE)
  { value: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI", tier: "standard", multiplier: 0.8 },             // $2.00/$8.00 → $3.80 blended
  { value: "openai/gpt-5.2", label: "GPT-5.2", provider: "OpenAI", tier: "standard", multiplier: 1.14 },            // $1.75/$14.00 → $5.43 blended
  { value: "openai/gpt-5.2-chat", label: "GPT-5.2 Chat", provider: "OpenAI", tier: "standard", multiplier: 1.14 },  // $1.75/$14.00 → $5.43 blended
  { value: "openai/gpt-5.3-chat", label: "GPT-5.3 Chat", provider: "OpenAI", tier: "standard", multiplier: 1.14 },  // $1.75/$14.00 → $5.43 blended
  { value: "openai/gpt-5.4", label: "GPT-5.4", provider: "OpenAI", tier: "standard", multiplier: 1.32 },            // $2.50/$15.00 → $6.25 blended
  // Advanced
  { value: "openai/o3", label: "GPT o3", provider: "OpenAI", tier: "advanced", multiplier: 0.8 },                    // $2.00/$8.00 → $3.80 blended
  { value: "openai/o3-mini", label: "GPT o3 Mini", provider: "OpenAI", tier: "standard", multiplier: 0.44 },         // $1.10/$4.40 → $2.09 blended
  { value: "openai/gpt-5.2-pro", label: "GPT-5.2 Pro", provider: "OpenAI", tier: "advanced", multiplier: 13.71 },    // $21/$168 → $65.10 blended
  { value: "openai/gpt-5.4-pro", label: "GPT-5.4 Pro", provider: "OpenAI", tier: "advanced", multiplier: 15.79 },    // $30/$180 → $75.00 blended
  // Codex
  { value: "openai/gpt-5.2-codex", label: "GPT-5.2 Codex", provider: "OpenAI", tier: "standard", multiplier: 1.14 },// $1.75/$14.00 → $5.43 blended
  { value: "openai/gpt-5.3-codex", label: "GPT-5.3 Codex", provider: "OpenAI", tier: "standard", multiplier: 1.14 },// $1.75/$14.00 → $5.43 blended

  // ---------------------------------------------------------------------------
  // Anthropic — direct Anthropic pricing + openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "Anthropic", tier: "fast", multiplier: 0.46 },  // $1/$5 → $2.20 blended
  // Standard
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", provider: "Anthropic", tier: "standard", multiplier: 1.39 }, // $3/$15 → $6.60 blended (direct)
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", provider: "Anthropic", tier: "standard", multiplier: 1.39 }, // $3/$15 → $6.60 blended
  // Advanced (Opus 4 removed — 4.6 is better, cheaper, 1M context)
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6", provider: "Anthropic", tier: "advanced", multiplier: 2.32 }, // $5/$25 → $11.00 blended

  // ---------------------------------------------------------------------------
  // Google — openrouter.ai, March 2026
  // (Gemini 2.0 Flash removed — deprecated June 2026)
  // ---------------------------------------------------------------------------
  // Fast
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tier: "fast", multiplier: 0.20 },          // $0.30/$2.50 → $0.96 blended
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tier: "fast", multiplier: 0.26 },     // $0.50/$3.00 → $1.25 blended
  { value: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", provider: "Google", tier: "fast", multiplier: 0.13 }, // $0.25/$1.50 → $0.63 blended
  // Standard
  { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro", provider: "Google", tier: "standard", multiplier: 0.82 },// $1.25/$10.00 → $3.88 blended
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "Google", tier: "standard", multiplier: 1.05 },// $2.00/$12.00 → $5.00 blended

  // ---------------------------------------------------------------------------
  // Meta (Llama) — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "meta-llama/llama-3.3-8b-instruct", label: "Llama 3.3 8B", provider: "Meta", tier: "fast", multiplier: 0.01 },    // ~$0.03/$0.05 → $0.04 blended
  { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout", provider: "Meta", tier: "fast", multiplier: 0.03 },            // $0.08/$0.30 → $0.15 blended
  // Standard
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", provider: "Meta", tier: "standard", multiplier: 0.04 }, // $0.10/$0.32 → $0.17 blended
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", provider: "Meta", tier: "standard", multiplier: 0.06 },  // $0.15/$0.60 → $0.29 blended
  // Advanced
  { value: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", provider: "Meta", tier: "advanced", multiplier: 0.84 }, // $4.00/$4.00 → $4.00 blended

  // ---------------------------------------------------------------------------
  // Mistral — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "mistralai/ministral-3b-2512", label: "Ministral 3B", provider: "Mistral", tier: "fast", multiplier: 0.02 },       // $0.10/$0.10 → $0.10 blended
  { value: "mistralai/ministral-8b-2512", label: "Ministral 8B", provider: "Mistral", tier: "fast", multiplier: 0.03 },       // $0.15/$0.15 → $0.15 blended
  { value: "mistralai/mistral-small-creative", label: "Mistral Small Creative", provider: "Mistral", tier: "fast", multiplier: 0.03 }, // $0.10/$0.30 → $0.16 blended
  // Standard
  { value: "mistralai/ministral-14b-2512", label: "Ministral 14B", provider: "Mistral", tier: "standard", multiplier: 0.04 }, // $0.20/$0.20 → $0.20 blended
  { value: "mistralai/mistral-large-2512", label: "Mistral Large 3", provider: "Mistral", tier: "standard", multiplier: 0.17 }, // $0.50/$1.50 → $0.80 blended
  { value: "mistralai/devstral-2512", label: "Devstral 2", provider: "Mistral", tier: "standard", multiplier: 0.19 },         // $0.40/$2.00 → $0.88 blended

  // ---------------------------------------------------------------------------
  // DeepSeek — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "deepseek/deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek", tier: "fast", multiplier: 0.10 },            // $0.32/$0.89 → $0.49 blended
  // Standard
  { value: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek", tier: "standard", multiplier: 0.06 },      // $0.26/$0.38 → $0.30 blended
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek", tier: "standard", multiplier: 0.26 },           // $0.70/$2.50 → $1.24 blended
  { value: "deepseek/deepseek-v3.2-speciale", label: "DeepSeek V3.2 Speciale", provider: "DeepSeek", tier: "standard", multiplier: 0.13 }, // $0.40/$1.20 → $0.64 blended

  // ---------------------------------------------------------------------------
  // Qwen — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "qwen/qwen3.5-9b", label: "Qwen 3.5 9B", provider: "Qwen", tier: "fast", multiplier: 0.02 },                     // $0.10/$0.15 → $0.12 blended
  { value: "qwen/qwen3.5-flash-02-23", label: "Qwen 3.5 Flash", provider: "Qwen", tier: "fast", multiplier: 0.04 },          // $0.10/$0.40 → $0.19 blended
  // Standard
  { value: "qwen/qwen3.5-27b", label: "Qwen 3.5 27B", provider: "Qwen", tier: "standard", multiplier: 0.13 },                // $0.20/$1.56 → $0.60 blended
  { value: "qwen/qwen3.5-plus-02-15", label: "Qwen 3.5 Plus", provider: "Qwen", tier: "standard", multiplier: 0.14 },        // $0.26/$1.56 → $0.65 blended
  { value: "qwen/qwen3.5-122b-a10b", label: "Qwen 3.5 122B MoE", provider: "Qwen", tier: "standard", multiplier: 0.17 },     // $0.26/$2.08 → $0.81 blended
  { value: "qwen/qwen3.5-397b-a17b", label: "Qwen 3.5 397B MoE", provider: "Qwen", tier: "standard", multiplier: 0.21 },     // $0.39/$2.34 → $0.97 blended
  // Advanced
  { value: "qwen/qwen3-max-thinking", label: "Qwen 3 Max Thinking", provider: "Qwen", tier: "advanced", multiplier: 0.36 },   // $0.78/$3.90 → $1.72 blended

  // ---------------------------------------------------------------------------
  // Amazon — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "amazon/nova-2-lite-v1", label: "Nova 2 Lite", provider: "Amazon", tier: "fast", multiplier: 0.20 },               // $0.30/$2.50 → $0.96 blended

  // ---------------------------------------------------------------------------
  // Cohere — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "cohere/command-r-plus", label: "Command R+", provider: "Cohere", tier: "standard", multiplier: 1.00 },             // ~$2.50/$10 → $4.75 blended (estimated)
  { value: "cohere/command-r", label: "Command R", provider: "Cohere", tier: "fast", multiplier: 0.06 },                       // ~$0.15/$0.60 → $0.29 blended

  // ---------------------------------------------------------------------------
  // xAI — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "x-ai/grok-2", label: "Grok 2", provider: "xAI", tier: "standard", multiplier: 1.0 },                              // ~$2/$10 → $4.80 blended
  { value: "x-ai/grok-3-mini-beta", label: "Grok 3 Mini", provider: "xAI", tier: "standard", multiplier: 0.08 },              // $0.30/$0.50 → $0.36 blended
  { value: "x-ai/grok-3-beta", label: "Grok 3", provider: "xAI", tier: "advanced", multiplier: 1.39 },                        // $3/$15 → $6.60 blended
  { value: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast", provider: "xAI", tier: "fast", multiplier: 0.06 },                   // $0.20/$0.50 → $0.29 blended — best agentic tool-calling, 2M ctx

  // ---------------------------------------------------------------------------
  // MiniMax — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "minimax/minimax-m2.5", label: "MiniMax M2.5", provider: "MiniMax", tier: "standard", multiplier: 0.10 },           // $0.27/$0.95 → $0.47 blended — strong at structured/productivity tasks
];

/** Default model for new agents */
export const DEFAULT_MODEL = "openai/gpt-4.1-mini";

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
