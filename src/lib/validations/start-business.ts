import { z } from "zod";

export const startBusinessProgressSchema = z.object({
  system_id: z.string().uuid(),
  current_step: z.number().int().min(1).max(10),
  direction_path: z.enum(["beginner", "stuck"]).nullable().optional(),
  industry_interests: z.array(z.string()).optional(),
  own_idea: z.string().max(500).nullable().optional(),
  tried_niche: z.string().max(200).nullable().optional(),
  what_went_wrong: z.string().max(500).nullable().optional(),
  growth_direction: z.string().max(200).nullable().optional(),
  location_city: z.string().max(200).nullable().optional(),
  location_target: z.string().max(200).nullable().optional(),
});

export type StartBusinessProgressInput = z.infer<typeof startBusinessProgressSchema>;
