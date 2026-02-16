"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { logger } from "@/lib/security/logger";

export async function submitOnboarding(
  answers: OnboardingInput
): Promise<{ error: string | null }> {
  const parsed = onboardingSchema.safeParse(answers);
  if (!parsed.success) {
    return { error: "Invalid answers. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please log in again." };
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      time_availability: parsed.data.time_availability,
      outreach_comfort: parsed.data.outreach_comfort,
      technical_comfort: parsed.data.technical_comfort,
      revenue_goal: parsed.data.revenue_goal,
      current_situation: parsed.data.current_situation,
      blockers: parsed.data.blockers,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    logger.error("Onboarding profile update failed", {
      userId: user.id,
      code: profileError.code,
      message: profileError.message,
    });
    return { error: "Failed to save your profile. Please try again." };
  }

  // Update user_metadata so middleware can check without DB query
  const { error: metaError } = await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });

  if (metaError) {
    logger.error("User metadata update failed", {
      userId: user.id,
      message: metaError.message,
    });
    // Non-fatal: profile was saved, metadata will sync on next JWT refresh
  }

  return { error: null };
}
