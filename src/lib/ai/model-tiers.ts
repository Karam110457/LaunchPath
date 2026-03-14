/**
 * Model definitions with cost-based credit pricing.
 *
 * Credits are proportional to actual API cost:
 *   credits = round((inputTokens × inputPrice + outputTokens × outputPrice) / 1_000_000 × CREDITS_PER_DOLLAR, 2)
 *   minimum 0.01 credit per request.
 *
 * CREDITS_PER_DOLLAR (150) is the single constant that controls margin.
 * 1 credit ≈ $0.00667 of API cost. At $29/1000 credits, this yields ~77% margin.
 *
 * Input/output prices are per million tokens, sourced from OpenRouter/provider
 * pricing as of March 2026. When prices change, update the prices here —
 * credits automatically adjust.
 */

export type ModelTier = "fast" | "standard" | "advanced";

/**
 * How many credits $1 of API cost translates to.
 * Higher = more credits per dollar = lower margin but more competitive.
 * 150 gives 60-77% margins across all subscription tiers.
 */
export const CREDITS_PER_DOLLAR = 150;

export interface ModelOption {
  /** Model ID sent to the provider (e.g. "openai/gpt-4o-mini") */
  value: string;
  /** Human-readable label */
  label: string;
  /** Provider for display grouping */
  provider: string;
  /** Display tier (fast / standard / advanced) — for UI grouping only */
  tier: ModelTier;
  /** Price per million INPUT tokens in USD */
  inputPrice: number;
  /** Price per million OUTPUT tokens in USD */
  outputPrice: number;
  /**
   * @deprecated Legacy flat multiplier — kept for UI display during transition.
   * Will be removed once UI components are updated to show cost-per-message.
   */
  multiplier: number;
  /** Whether this model has low enough latency for voice conversations */
  voiceReady?: boolean;
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
  "Inception",
  "ByteDance",
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
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tier: "fast", inputPrice: 0.15, outputPrice: 0.60, multiplier: 0.06, voiceReady: true },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI", tier: "fast", inputPrice: 0.40, outputPrice: 1.60, multiplier: 0.16, voiceReady: true },
  { value: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "OpenAI", tier: "fast", inputPrice: 0.10, outputPrice: 0.40, multiplier: 0.04, voiceReady: true },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", provider: "OpenAI", tier: "fast", inputPrice: 0.25, outputPrice: 2.00, multiplier: 0.16, voiceReady: true },
  // Standard
  { value: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tier: "standard", inputPrice: 2.50, outputPrice: 10.00, multiplier: 1.0, voiceReady: true },
  { value: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI", tier: "standard", inputPrice: 2.00, outputPrice: 8.00, multiplier: 0.8 },
  { value: "openai/gpt-5.2", label: "GPT-5.2", provider: "OpenAI", tier: "standard", inputPrice: 1.75, outputPrice: 14.00, multiplier: 1.14 },
  { value: "openai/gpt-5.2-chat", label: "GPT-5.2 Chat", provider: "OpenAI", tier: "standard", inputPrice: 1.75, outputPrice: 14.00, multiplier: 1.14 },
  { value: "openai/gpt-5.3-chat", label: "GPT-5.3 Chat", provider: "OpenAI", tier: "standard", inputPrice: 1.75, outputPrice: 14.00, multiplier: 1.14 },
  { value: "openai/gpt-5.4", label: "GPT-5.4", provider: "OpenAI", tier: "standard", inputPrice: 2.50, outputPrice: 15.00, multiplier: 1.32 },
  // Advanced (reasoning models — NOT voice-ready due to deliberation latency)
  { value: "openai/o3", label: "GPT o3", provider: "OpenAI", tier: "advanced", inputPrice: 2.00, outputPrice: 8.00, multiplier: 0.8 },
  { value: "openai/o3-mini", label: "GPT o3 Mini", provider: "OpenAI", tier: "standard", inputPrice: 1.10, outputPrice: 4.40, multiplier: 0.44 },
  { value: "openai/gpt-5.2-pro", label: "GPT-5.2 Pro", provider: "OpenAI", tier: "advanced", inputPrice: 21.00, outputPrice: 168.00, multiplier: 13.71 },
  { value: "openai/gpt-5.4-pro", label: "GPT-5.4 Pro", provider: "OpenAI", tier: "advanced", inputPrice: 30.00, outputPrice: 180.00, multiplier: 15.79 },
  // Codex
  { value: "openai/gpt-5.2-codex", label: "GPT-5.2 Codex", provider: "OpenAI", tier: "standard", inputPrice: 1.75, outputPrice: 14.00, multiplier: 1.14 },
  { value: "openai/gpt-5.3-codex", label: "GPT-5.3 Codex", provider: "OpenAI", tier: "standard", inputPrice: 1.75, outputPrice: 14.00, multiplier: 1.14 },

  // ---------------------------------------------------------------------------
  // Anthropic — direct Anthropic pricing + openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "Anthropic", tier: "fast", inputPrice: 1.00, outputPrice: 5.00, multiplier: 0.46, voiceReady: true },
  // Standard
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", provider: "Anthropic", tier: "standard", inputPrice: 3.00, outputPrice: 15.00, multiplier: 1.39 },
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", provider: "Anthropic", tier: "standard", inputPrice: 3.00, outputPrice: 15.00, multiplier: 1.39 },
  // Advanced
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6", provider: "Anthropic", tier: "advanced", inputPrice: 5.00, outputPrice: 25.00, multiplier: 2.32 },

  // ---------------------------------------------------------------------------
  // Google — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tier: "fast", inputPrice: 0.30, outputPrice: 2.50, multiplier: 0.20, voiceReady: true },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tier: "fast", inputPrice: 0.50, outputPrice: 3.00, multiplier: 0.26, voiceReady: true },
  { value: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", provider: "Google", tier: "fast", inputPrice: 0.25, outputPrice: 1.50, multiplier: 0.13, voiceReady: true },
  // Standard
  { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro", provider: "Google", tier: "standard", inputPrice: 1.25, outputPrice: 10.00, multiplier: 0.82 },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "Google", tier: "standard", inputPrice: 2.00, outputPrice: 12.00, multiplier: 1.05 },

  // ---------------------------------------------------------------------------
  // Meta (Llama) — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "meta-llama/llama-3.3-8b-instruct", label: "Llama 3.3 8B", provider: "Meta", tier: "fast", inputPrice: 0.03, outputPrice: 0.05, multiplier: 0.01, voiceReady: true },
  { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout", provider: "Meta", tier: "fast", inputPrice: 0.08, outputPrice: 0.30, multiplier: 0.03, voiceReady: true },
  // Standard
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", provider: "Meta", tier: "standard", inputPrice: 0.10, outputPrice: 0.32, multiplier: 0.04 },
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", provider: "Meta", tier: "standard", inputPrice: 0.15, outputPrice: 0.60, multiplier: 0.06 },
  // Advanced
  { value: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", provider: "Meta", tier: "advanced", inputPrice: 4.00, outputPrice: 4.00, multiplier: 0.84 },

  // ---------------------------------------------------------------------------
  // Mistral — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "mistralai/ministral-3b-2512", label: "Ministral 3B", provider: "Mistral", tier: "fast", inputPrice: 0.10, outputPrice: 0.10, multiplier: 0.02, voiceReady: true },
  { value: "mistralai/ministral-8b-2512", label: "Ministral 8B", provider: "Mistral", tier: "fast", inputPrice: 0.15, outputPrice: 0.15, multiplier: 0.03, voiceReady: true },
  { value: "mistralai/mistral-small-creative", label: "Mistral Small Creative", provider: "Mistral", tier: "fast", inputPrice: 0.10, outputPrice: 0.30, multiplier: 0.03, voiceReady: true },
  // Standard
  { value: "mistralai/ministral-14b-2512", label: "Ministral 14B", provider: "Mistral", tier: "standard", inputPrice: 0.20, outputPrice: 0.20, multiplier: 0.04 },
  { value: "mistralai/mistral-large-2512", label: "Mistral Large 3", provider: "Mistral", tier: "standard", inputPrice: 0.50, outputPrice: 1.50, multiplier: 0.17 },
  { value: "mistralai/devstral-2512", label: "Devstral 2", provider: "Mistral", tier: "standard", inputPrice: 0.40, outputPrice: 2.00, multiplier: 0.19 },

  // ---------------------------------------------------------------------------
  // DeepSeek — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "deepseek/deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek", tier: "fast", inputPrice: 0.32, outputPrice: 0.89, multiplier: 0.10, voiceReady: true },
  // Standard
  { value: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek", tier: "standard", inputPrice: 0.26, outputPrice: 0.38, multiplier: 0.06 },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek", tier: "standard", inputPrice: 0.70, outputPrice: 2.50, multiplier: 0.26 },
  { value: "deepseek/deepseek-v3.2-speciale", label: "DeepSeek V3.2 Speciale", provider: "DeepSeek", tier: "standard", inputPrice: 0.40, outputPrice: 1.20, multiplier: 0.13 },

  // ---------------------------------------------------------------------------
  // Qwen — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  // Fast
  { value: "qwen/qwen3.5-9b", label: "Qwen 3.5 9B", provider: "Qwen", tier: "fast", inputPrice: 0.10, outputPrice: 0.15, multiplier: 0.02, voiceReady: true },
  { value: "qwen/qwen3.5-flash-02-23", label: "Qwen 3.5 Flash", provider: "Qwen", tier: "fast", inputPrice: 0.10, outputPrice: 0.40, multiplier: 0.04, voiceReady: true },
  // Standard
  { value: "qwen/qwen3.5-27b", label: "Qwen 3.5 27B", provider: "Qwen", tier: "standard", inputPrice: 0.20, outputPrice: 1.56, multiplier: 0.13 },
  { value: "qwen/qwen3.5-plus-02-15", label: "Qwen 3.5 Plus", provider: "Qwen", tier: "standard", inputPrice: 0.26, outputPrice: 1.56, multiplier: 0.14 },
  { value: "qwen/qwen3.5-122b-a10b", label: "Qwen 3.5 122B MoE", provider: "Qwen", tier: "standard", inputPrice: 0.26, outputPrice: 2.08, multiplier: 0.17 },
  { value: "qwen/qwen3.5-397b-a17b", label: "Qwen 3.5 397B MoE", provider: "Qwen", tier: "standard", inputPrice: 0.39, outputPrice: 2.34, multiplier: 0.21 },
  // Advanced
  { value: "qwen/qwen3-max-thinking", label: "Qwen 3 Max Thinking", provider: "Qwen", tier: "advanced", inputPrice: 0.78, outputPrice: 3.90, multiplier: 0.36 },

  // ---------------------------------------------------------------------------
  // Amazon — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "amazon/nova-2-lite-v1", label: "Nova 2 Lite", provider: "Amazon", tier: "fast", inputPrice: 0.30, outputPrice: 2.50, multiplier: 0.20, voiceReady: true },

  // ---------------------------------------------------------------------------
  // Cohere — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "cohere/command-r-plus", label: "Command R+", provider: "Cohere", tier: "standard", inputPrice: 2.50, outputPrice: 10.00, multiplier: 1.00 },
  { value: "cohere/command-r", label: "Command R", provider: "Cohere", tier: "fast", inputPrice: 0.15, outputPrice: 0.60, multiplier: 0.06, voiceReady: true },

  // ---------------------------------------------------------------------------
  // xAI — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "x-ai/grok-2", label: "Grok 2", provider: "xAI", tier: "standard", inputPrice: 2.00, outputPrice: 10.00, multiplier: 1.0 },
  { value: "x-ai/grok-3-mini-beta", label: "Grok 3 Mini", provider: "xAI", tier: "standard", inputPrice: 0.30, outputPrice: 0.50, multiplier: 0.08 },
  { value: "x-ai/grok-3-beta", label: "Grok 3", provider: "xAI", tier: "advanced", inputPrice: 3.00, outputPrice: 15.00, multiplier: 1.39 },
  { value: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast", provider: "xAI", tier: "fast", inputPrice: 0.20, outputPrice: 0.50, multiplier: 0.06, voiceReady: true },

  // ---------------------------------------------------------------------------
  // MiniMax — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "minimax/minimax-m2.5", label: "MiniMax M2.5", provider: "MiniMax", tier: "standard", inputPrice: 0.27, outputPrice: 0.95, multiplier: 0.10 },

  // ---------------------------------------------------------------------------
  // Inception — openrouter.ai, March 2026 (voice-optimized diffusion LLM)
  // ---------------------------------------------------------------------------
  { value: "inception/mercury-2", label: "Mercury 2", provider: "Inception", tier: "fast", inputPrice: 0.25, outputPrice: 0.75, multiplier: 0.08, voiceReady: true },

  // ---------------------------------------------------------------------------
  // ByteDance — openrouter.ai, March 2026
  // ---------------------------------------------------------------------------
  { value: "bytedance-seed/seed-2.0-mini", label: "Seed 2.0 Mini", provider: "ByteDance", tier: "fast", inputPrice: 0.10, outputPrice: 0.40, multiplier: 0.04, voiceReady: true },
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
 * @deprecated Use getModelPrices() + calculateCredits() instead.
 * Kept for UI components that still reference multiplier during transition.
 */
export function getModelMultiplier(modelId: string): number {
  const match = MODEL_OPTIONS.find((m) => m.value === modelId);
  return match?.multiplier ?? 1.0;
}

/**
 * Get a model's input/output prices per million tokens.
 * Falls back to GPT-4o-level pricing ($2.50/$10.00) for unknown models.
 */
export function getModelPrices(modelId: string): { inputPrice: number; outputPrice: number } {
  const match = MODEL_OPTIONS.find((m) => m.value === modelId);
  return {
    inputPrice: match?.inputPrice ?? 2.50,
    outputPrice: match?.outputPrice ?? 10.00,
  };
}

/**
 * Calculate actual credits consumed from real token usage.
 *
 * Formula: round((inputTokens × inputPrice + outputTokens × outputPrice) / 1_000_000 × CREDITS_PER_DOLLAR, 2)
 * Minimum 0.01 credit per request. Returns 1 if token counts are unavailable.
 */
export function calculateCredits(
  modelId: string,
  inputTokens: number | undefined,
  outputTokens: number | undefined
): number {
  const inp = inputTokens ?? 0;
  const out = outputTokens ?? 0;
  if (inp + out === 0) return 1; // Fallback when token count unavailable

  const { inputPrice, outputPrice } = getModelPrices(modelId);
  const costDollars = (inp * inputPrice + out * outputPrice) / 1_000_000;
  const credits = costDollars * CREDITS_PER_DOLLAR;

  return Math.max(0.01, Math.round(credits * 100) / 100);
}

/**
 * Estimate credits for pre-flight check (before response).
 * Assumes ~1500 input tokens + ~500 output tokens for a typical exchange.
 * Minimum estimate of 0.01 credit.
 */
export function estimateCredits(modelId: string): number {
  const { inputPrice, outputPrice } = getModelPrices(modelId);
  const estimatedCost = (1500 * inputPrice + 500 * outputPrice) / 1_000_000;
  const credits = estimatedCost * CREDITS_PER_DOLLAR;
  return Math.max(0.01, Math.round(credits * 100) / 100);
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

/**
 * Check if a model is suitable for voice conversations (low TTFT).
 */
export function isVoiceReadyModel(modelId: string): boolean {
  const match = MODEL_OPTIONS.find((m) => m.value === modelId);
  return match?.voiceReady === true;
}

/**
 * Get all voice-ready models, sorted by price (cheapest first).
 */
export function getVoiceReadyModels(): ModelOption[] {
  return MODEL_OPTIONS
    .filter((m) => m.voiceReady)
    .sort((a, b) => (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice));
}
