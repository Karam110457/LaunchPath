/**
 * LaunchPath stage terminology — premium, execution-first naming.
 * Internal keys (offer_blueprint, build_plan, sales_pack) stay unchanged for API/DB.
 * User-facing labels: Offer Thesis, Delivery System, Revenue Engine.
 *
 * Mapping (internal → display):
 *   offer_blueprint → Offer Thesis
 *   build_plan      → Delivery System
 *   sales_pack      → Revenue Engine
 */

export type InternalStageKey = "offer_blueprint" | "build_plan" | "sales_pack";

/** Display labels for nav, cards, and CTAs */
export const STAGE_LABELS: Record<InternalStageKey, string> = {
  offer_blueprint: "Offer Thesis",
  build_plan: "Delivery System",
  sales_pack: "Revenue Engine",
};

/** Get display label from internal key */
export function getStageLabel(internalKey: string): string {
  return STAGE_LABELS[internalKey as InternalStageKey] ?? internalKey;
}

/** Stage config for waitlist/How it Works: outcome, artifact, execution */
export const STAGES = [
  {
    internalKey: "offer_blueprint" as const,
    step: "01",
    title: "Pick a Profitable Offer",
    description: "Know exactly what to sell, who it's for, and why it wins.",
    detail: "OFFER CLARITY",
  },
  {
    internalKey: "build_plan" as const,
    step: "02",
    title: "Map Your Build Path",
    description: "Get the tool stack, workflow sequence, and implementation order.",
    detail: "BUILD BLUEPRINT",
  },
  {
    internalKey: "sales_pack" as const,
    step: "03",
    title: "Launch Client Acquisition",
    description: "Get a clear go-to-market plan with sales prep and call training.",
    detail: "ACQUISITION PLAN",
  },
] as const;
