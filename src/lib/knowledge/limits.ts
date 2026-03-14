/**
 * Knowledge base limits.
 *
 * Centralised so all upload/scrape/FAQ routes share the same cap.
 * When subscription tiers are implemented, swap the flat default
 * for a lookup based on the user's plan.
 */

/** Default document limit when no plan tier is available. */
const DEFAULT_MAX_DOCS = 50;

/**
 * Chunk-based limits per tier (for future use).
 * Uncomment and wire into getKnowledgeLimits() when plans ship.
 *
 * const TIER_LIMITS: Record<string, { maxDocs: number; maxChunks: number }> = {
 *   free:     { maxDocs: 20,  maxChunks: 200 },
 *   starter:  { maxDocs: 50,  maxChunks: 500 },
 *   growth:   { maxDocs: 100, maxChunks: 1500 },
 *   agency:   { maxDocs: 200, maxChunks: 3000 },
 *   scale:    { maxDocs: 500, maxChunks: 10000 },
 * };
 */

export interface KnowledgeLimits {
  maxDocs: number;
  /** Max total chunks across all docs for this agent. null = unlimited. */
  maxChunks: number | null;
}

/**
 * Get knowledge base limits for an agent owner.
 *
 * @param _planTier - Subscription tier (unused until plans ship).
 */
export function getKnowledgeLimits(_planTier?: string): KnowledgeLimits {
  // When tiers are built, look up TIER_LIMITS[_planTier] here.
  return { maxDocs: DEFAULT_MAX_DOCS, maxChunks: null };
}
