import { z } from "zod";

// -- Niche Analysis (Serge) output schema --

export const aiRecommendationSchema = z.object({
  niche: z.string(),
  score: z.number().min(0).max(100),
  target_segment: z.object({
    description: z.string(),
    why: z.string(),
  }),
  bottleneck: z.string(),
  strategic_insight: z.string(),
  your_solution: z.string(),
  revenue_potential: z.object({
    per_client: z.string(),
    target_clients: z.number(),
    monthly_total: z.string(),
  }),
  why_for_you: z.string(),
  ease_of_finding: z.string(),
  segment_scores: z.object({
    roi_from_service: z.number().min(0).max(25),
    can_afford_it: z.number().min(0).max(25),
    guarantee_results: z.number().min(0).max(25),
    easy_to_find: z.number().min(0).max(25),
    total: z.number().min(0).max(100),
  }),
});

export const nicheAnalysisOutputSchema = z.object({
  recommendations: z.array(aiRecommendationSchema).min(1).max(3),
  reasoning: z.string(),
});

export type NicheAnalysisOutput = z.infer<typeof nicheAnalysisOutputSchema>;
export type AIRecommendation = z.infer<typeof aiRecommendationSchema>;

// -- Offer Transformation output schema (used by the offer agent in workflow) --

export const offerTransformationOutputSchema = z.object({
  transformation_from: z.string(),
  transformation_to: z.string(),
  system_description: z.string(),
});

export type OfferTransformationOutput = z.infer<
  typeof offerTransformationOutputSchema
>;

/**
 * @deprecated Use offerTransformationOutputSchema + guaranteeOutputSchema instead.
 * Kept for backward compatibility with any code that imports this directly.
 */
export const offerDetailsOutputSchema = z.object({
  transformation_from: z.string(),
  transformation_to: z.string(),
  system_description: z.string(),
  guarantee: z.string(),
});

export type OfferDetailsOutput = z.infer<typeof offerDetailsOutputSchema>;

// -- Guarantee Agent output schema --

export const guaranteeOutputSchema = z.object({
  guarantee_text: z.string(),
  guarantee_type: z.enum(["time_bound", "outcome_based", "risk_reversal"]),
  confidence_notes: z.string(),
});

export type GuaranteeOutput = z.infer<typeof guaranteeOutputSchema>;

// -- Pricing Agent output schema --

export const aiPricingOutputSchema = z.object({
  pricing_setup: z.number(),
  pricing_monthly: z.number(),
  rationale: z.string(),
  comparable_services: z.array(
    z.object({ service: z.string(), price_range: z.string() })
  ),
  revenue_projection: z.object({
    clients_needed: z.number(),
    monthly_revenue: z.string(),
  }),
});

export type AIPricingOutput = z.infer<typeof aiPricingOutputSchema>;

// -- Assembled Offer (workflow output) schema --

export const assembledOfferSchema = z.object({
  segment: z.string(),
  transformation_from: z.string(),
  transformation_to: z.string(),
  system_description: z.string(),
  guarantee_text: z.string(),
  guarantee_type: z.enum(["time_bound", "outcome_based", "risk_reversal"]),
  guarantee_confidence: z.string(),
  pricing_setup: z.number(),
  pricing_monthly: z.number(),
  pricing_rationale: z.string(),
  pricing_comparables: z.array(
    z.object({ service: z.string(), price_range: z.string() })
  ),
  revenue_projection: z.object({
    clients_needed: z.number(),
    monthly_revenue: z.string(),
  }),
  delivery_model: z.string(),
  validation_status: z
    .enum(["passed", "needs_review", "failed"])
    .default("passed"),
  validation_notes: z.array(z.string()).default([]),
});

export type AssembledOffer = z.infer<typeof assembledOfferSchema>;

// -- Demo Page Config schemas --

export const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["text", "number", "select", "textarea"]),
  placeholder: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const demoConfigSchema = z.object({
  // Page copy
  agent_name: z.string(),
  agent_description: z.string(),
  hero_headline: z.string(),
  hero_subheadline: z.string(),
  cta_button_text: z.string(),

  // Offer integration
  show_guarantee: z.boolean(),
  guarantee_text: z.string().optional(),
  show_pricing: z.boolean(),
  pricing_text: z.string().optional(),
  transformation_headline: z.string(),

  // Form
  form_fields: z.array(formFieldSchema).min(3).max(10),

  // AI scoring rules (becomes the demo agent's system prompt)
  scoring_prompt: z.string(),

  // Metadata
  niche_slug: z.string(),
  validation_status: z
    .enum(["passed", "needs_review", "failed"])
    .default("passed"),
  validation_notes: z.array(z.string()).default([]),
});

export type DemoConfig = z.infer<typeof demoConfigSchema>;

// -- Demo Submission output schema --

export const demoResultSchema = z.object({
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  score: z.number().min(0).max(100),
  estimated_value: z.string(),
  fit_analysis: z.record(z.string(), z.string()),
  insights: z.array(z.string()),
  next_steps: z.array(z.string()),
});

export type DemoResult = z.infer<typeof demoResultSchema>;
