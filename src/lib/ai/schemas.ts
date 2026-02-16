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

// -- Offer Generation output schema --

export const offerDetailsOutputSchema = z.object({
  transformation_from: z.string(),
  transformation_to: z.string(),
  system_description: z.string(),
  guarantee: z.string(),
});

export type OfferDetailsOutput = z.infer<typeof offerDetailsOutputSchema>;

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
