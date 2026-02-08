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
    title: "Offer Thesis",
    description: "One sellable idea, validated. No guessing what the market wants.",
    detail: "Validated offer doc",
    time: "~15 min",
  },
  {
    internalKey: "build_plan" as const,
    step: "02",
    title: "Delivery System",
    description: "Step-by-step build with tools and templates. Ship, don’t research.",
    detail: "Step-by-step guide",
    time: "~1–2 hrs",
  },
  {
    internalKey: "sales_pack" as const,
    step: "03",
    title: "Revenue Engine",
    description: "Scripts, outreach, objection handling. Start real conversations.",
    detail: "Outreach scripts",
    time: "~30 min",
  },
] as const;
