"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { logger } from "@/lib/security/logger";

export async function updateProfile(
  answers: OnboardingInput
): Promise<{ error: string | null }> {
  const parsed = onboardingSchema.safeParse(answers);
  if (!parsed.success) {
    return { error: "Invalid answers." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      time_availability: parsed.data.time_availability,
      outreach_comfort: parsed.data.outreach_comfort,
      technical_comfort: parsed.data.technical_comfort,
      revenue_goal: parsed.data.revenue_goal,
      current_situation: parsed.data.current_situation,
      blockers: parsed.data.blockers,
    })
    .eq("id", user.id);

  if (error) {
    logger.error("Profile update failed", { userId: user.id, code: error.code });
    return { error: "Failed to update profile." };
  }

  return { error: null };
}
