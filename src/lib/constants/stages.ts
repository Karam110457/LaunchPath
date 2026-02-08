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

/** Stage config for waitlist/How it Works */
export const STAGES = [
  {
    internalKey: "offer_blueprint" as const,
    step: "1",
    title: "Pick a Profitable Offer",
    description: "Know exactly what to sell, who it's for, and why it wins.",
  },
  {
    internalKey: "build_plan" as const,
    step: "2",
    title: "Map Your Build Path",
    description: "Get the tool stack, workflow sequence, and implementation order to execute fast.",
  },
  {
    internalKey: "sales_pack" as const,
    step: "3",
    title: "Deploy the Client Acquisition Plan",
    description: "Receive a step-by-step go-to-market plan, plus sales call prep and training, so you can convert demand into clients.",
  },
] as const;
