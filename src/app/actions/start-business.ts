"use server";

import { createClient } from "@/lib/supabase/server";
import {
  startBusinessProgressSchema,
  type StartBusinessProgressInput,
} from "@/lib/validations/start-business";
import { logger } from "@/lib/security/logger";

export async function saveStartBusinessProgress(
  data: StartBusinessProgressInput
): Promise<{ error: string | null }> {
  const parsed = startBusinessProgressSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const { system_id, ...fields } = parsed.data;

  const { error } = await supabase
    .from("user_systems")
    .update(fields)
    .eq("id", system_id)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Start business progress save failed", {
      userId: user.id,
      systemId: system_id,
      code: error.code,
    });
    return { error: "Failed to save progress." };
  }

  return { error: null };
}
