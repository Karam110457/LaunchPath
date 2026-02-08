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
  const email = (formData.get("email") as string)?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    logger.warn("Waitlist step2: invalid or missing email", { email: email ? "(present)" : "missing" });
    return { status: "error", message: "Invalid email." };
  }

  const roleStage = (formData.get("role_stage") as string)?.trim() || null;
  const biggestBlocker = (formData.get("biggest_blocker") as string)?.trim().slice(0, 500) || null;
  const skipped = formData.get("skipped") === "true";

  logger.info("Waitlist step2: attempt", {
    email: email.slice(0, 3) + "***",
    role_stage: roleStage ?? "(empty)",
    biggest_blocker_len: biggestBlocker?.length ?? 0,
    skipped,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waitlist")
    .update({
      role_stage: skipped ? null : roleStage,
      biggest_blocker: skipped ? null : biggestBlocker,
      step2_completed: true,
    })
    .eq("email", email)
    .select("id");

  if (error) {
    logger.error("Waitlist step2 update failed", { code: error.code, message: error.message, email: email.slice(0, 3) + "***" });
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const rowsUpdated = data?.length ?? 0;
  if (rowsUpdated === 0) {
    logger.warn("Waitlist step2: no row updated (email not found or RLS)", { email: email.slice(0, 3) + "***" });
    return { status: "error", message: "We couldn't find your sign-up. Please try again from the start." };
  }

  logger.info("Waitlist step2: success", { email: email.slice(0, 3) + "***", rowsUpdated });
  return {
    status: "success",
    message: skipped ? "You're all set. We'll be in touch." : "Thanks — that helps us tailor your roadmap.",
  };
}
