/**
 * Fire-and-forget offer pre-generation for the chat flow.
 * Called after the user selects a niche, so the offer is ready by the time
 * the agent calls generate_offer().
 */

import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";

export async function preGenerateOfferForChat(
  systemId: string,
  userId: string
): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [systemResult, profileResult] = await Promise.all([
    supabase.from("user_systems").select("*").eq("id", systemId).eq("user_id", userId).single(),
    supabase.from("user_profiles").select("*").eq("id", userId).single(),
  ]);

  if (!systemResult.data || !profileResult.data) return;

  const system = systemResult.data;
  const profile = profileResult.data;
  const chosenRec = system.chosen_recommendation as {
    niche: string;
    bottleneck: string;
    your_solution: string;
    target_segment: { description: string; why: string };
    revenue_potential: { per_client: string; target_clients: number; monthly_total: string };
    strategic_insight: string;
  } | null;

  if (!chosenRec) return;
  // Don't overwrite an existing offer
  if (system.offer && typeof system.offer === "object") {
    const existing = system.offer as Record<string, unknown>;
    if (existing.transformation_from) return;
  }

  const workflow = mastra.getWorkflow("offer-generation");
  const run = await workflow.createRun();
  const result = await run.start({
    inputData: {
      chosenRecommendation: chosenRec,
      profile: {
        time_availability: profile.time_availability,
        revenue_goal: profile.revenue_goal,
        blockers: profile.blockers ?? [],
      },
      answers: {
        delivery_model: system.delivery_model,
        pricing_direction: system.pricing_direction,
        location_city: system.location_city,
      },
    },
  });

  if (result.status === "success") {
    await supabase
      .from("user_systems")
      .update({ offer: result.result as unknown as Record<string, unknown> })
      .eq("id", systemId)
      .eq("user_id", userId);
    logger.info("Offer pre-generated for chat", { systemId, userId });
  }
}
