"use server";

import { createClient } from "@/lib/supabase/server";
import { offerSchema } from "@/lib/validations/offer";
import { logger } from "@/lib/security/logger";

export async function saveOffer(
  systemId: string,
  offer: unknown
): Promise<{ error: string | null }> {
  const parsed = offerSchema.safeParse(offer);
  if (!parsed.success) {
    return { error: "Invalid offer data." };
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
    .from("user_systems")
    .update({ offer: parsed.data as Record<string, unknown> })
    .eq("id", systemId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Offer save failed", {
      userId: user.id,
      systemId,
      code: error.code,
    });
    return { error: "Failed to save offer." };
  }

  logger.info("Offer saved", { systemId, userId: user.id });
  return { error: null };
}
