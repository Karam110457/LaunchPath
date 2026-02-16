import { z } from "zod";

export const startBusinessProgressSchema = z.object({
  system_id: z.string().uuid(),
  current_step: z.number().int().min(1).max(10),
  intent: z.enum(["first_client", "new_service", "test_niche", "content"]).nullable().optional(),
  direction_path: z.enum(["beginner", "stuck", "has_clients"]).nullable().optional(),
  industry_interests: z.array(z.string()).optional(),
  own_idea: z.string().max(500).nullable().optional(),
  tried_niche: z.string().max(200).nullable().optional(),
  what_went_wrong: z.string().max(500).nullable().optional(),
  current_niche: z.string().max(200).nullable().optional(),
  current_clients: z.number().int().min(0).max(100).nullable().optional(),
  current_pricing: z.string().max(200).nullable().optional(),
  growth_direction: z.string().max(200).nullable().optional(),
  delivery_model: z.string().max(200).nullable().optional(),
  pricing_direction: z.string().max(200).nullable().optional(),
  location_city: z.string().max(200).nullable().optional(),
  location_target: z.string().max(200).nullable().optional(),
});

export type StartBusinessProgressInput = z.infer<typeof startBusinessProgressSchema>;
