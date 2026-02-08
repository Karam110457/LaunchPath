"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";

export type Step2State = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function completeWaitlistStep2(
  _prevState: Step2State,
  formData: FormData
): Promise<Step2State> {
  const email = formData.get("email") as string;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Invalid email." };
  }

  const roleStage = formData.get("role_stage") as string;
  const biggestBlocker = (formData.get("biggest_blocker") as string)?.trim().slice(0, 500) || null;
  const skipped = formData.get("skipped") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist")
    .update({
      role_stage: skipped ? null : roleStage || null,
      biggest_blocker: skipped ? null : biggestBlocker,
      step2_completed: true,
    })
    .eq("email", email);

  if (error) {
    logger.error("Waitlist step2 update failed", { code: error.code, message: error.message });
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return {
    status: "success",
    message: skipped ? "You're all set. We'll be in touch." : "Thanks — that helps us tailor your experience.",
  };
}
