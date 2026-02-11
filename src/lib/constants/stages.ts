/**
 * LaunchPath stage terminology — simple, beginner-friendly (matches waitlist).
 * Internal keys (offer_blueprint, build_plan, sales_pack) stay unchanged for API/DB.
 *
 * User-facing (no jargon):
 *   offer_blueprint → Pick a Profitable Offer / "My Offer" (short)
 *   build_plan      → Map Your Build Path / "Build Path" (short)
 *   sales_pack      → Launch Client Acquisition / "Get Clients" (short)
 */

export type InternalStageKey = "offer_blueprint" | "build_plan" | "sales_pack";

/** Full labels for page titles, cards, and CTAs (waitlist tone) */
export const STAGE_LABELS: Record<InternalStageKey, string> = {
  offer_blueprint: "Pick a Profitable Offer",
  build_plan: "Map Your Build Path",
  sales_pack: "Launch Client Acquisition",
};

/** Short labels for sidebar/nav */
export const STAGE_LABELS_SHORT: Record<InternalStageKey, string> = {
  offer_blueprint: "My Offer",
  build_plan: "Build Path",
  sales_pack: "Get Clients",
};

/** Get full display label from internal key */
export function getStageLabel(internalKey: string): string {
  return STAGE_LABELS[internalKey as InternalStageKey] ?? internalKey;
}

/** Get short label for nav/sidebar */
export function getStageLabelShort(internalKey: string): string {
  return STAGE_LABELS_SHORT[internalKey as InternalStageKey] ?? STAGE_LABELS[internalKey as InternalStageKey] ?? internalKey;
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
