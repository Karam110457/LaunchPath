import { z } from "zod";

export const onboardingSchema = z.object({
  current_situation: z.enum(["ready_to_start", "tried_before"]),
  time_availability: z.enum(["under_5", "5_to_15", "15_to_30", "30_plus"]),
  revenue_goal: z.enum(["500_1k", "1k_3k", "3k_5k", "5k_10k_plus"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
