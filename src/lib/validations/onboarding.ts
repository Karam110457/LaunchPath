import { z } from "zod";

export const onboardingSchema = z.object({
  time_availability: z.enum(["under_5", "5_to_15", "15_to_30", "30_plus"]),
  outreach_comfort: z.enum(["never_done", "nervous_willing", "fairly_comfortable", "love_sales"]),
  technical_comfort: z.enum(["use_apps", "used_tools", "built_basic", "can_code"]),
  revenue_goal: z.enum(["500_1k", "1k_3k", "3k_5k", "5k_10k_plus"]),
  current_situation: z.enum(["complete_beginner", "consumed_content", "tried_no_clients", "has_clients"]),
  blockers: z
    .array(z.enum(["no_niche", "no_offer", "cant_build", "cant_find_clients", "scared_delivery", "keep_switching"]))
    .min(1, "Select at least one blocker"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
