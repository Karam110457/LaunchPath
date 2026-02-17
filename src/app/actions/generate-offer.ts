"use server";

import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import type { AssembledOffer } from "@/lib/ai/schemas";

interface OfferResult {
  offer: AssembledOffer | null;
  error: string | null;
}

/**
 * Generate a complete offer using the offer-generation Mastra workflow.
 * Runs transformation, guarantee, and pricing agents in parallel,
 * then assembles and validates the result.
 */
export async function generateOfferDetails(
  systemId: string
): Promise<OfferResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { offer: null, error: "Not authenticated." };
  }

  const [systemResult, profileResult] = await Promise.all([
    supabase
      .from("user_systems")
      .select("*")
      .eq("id", systemId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
  ]);

  if (systemResult.error || !systemResult.data) {
    return { offer: null, error: "System not found." };
  }
  if (profileResult.error || !profileResult.data) {
    return { offer: null, error: "Profile not found." };
  }

  const system = systemResult.data;
  const profile = profileResult.data;
  const chosenRec = system.chosen_recommendation as {
    niche: string;
    bottleneck: string;
    your_solution: string;
    target_segment: { description: string; why: string };
    revenue_potential: {
      per_client: string;
      target_clients: number;
      monthly_total: string;
    };
    strategic_insight: string;
  } | null;

  if (!chosenRec) {
    return {
      offer: null,
      error: "No niche selected. Go back and choose a recommendation.",
    };
  }

  // Check for pre-generated offer (from fire-and-forget in chooseRecommendation)
  if (system.offer && typeof system.offer === "object") {
    const existing = system.offer as Record<string, unknown>;
    if (existing.transformation_from && existing.guarantee_text) {
      logger.info("Using pre-generated offer", { systemId, userId: user.id });
      return { offer: existing as unknown as AssembledOffer, error: null };
    }
  }

  try {
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

    if (result.status !== "success") {
      logger.error("Offer workflow failed", {
        systemId,
        userId: user.id,
        status: result.status,
      });
      return { offer: null, error: "Offer generation failed. Please try again." };
    }

    const offer = result.result;

    // Save the assembled offer to the database
    const { error: updateError } = await supabase
      .from("user_systems")
      .update({ offer: offer as unknown as Record<string, unknown> })
      .eq("id", systemId)
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Failed to save offer", {
        systemId,
        userId: user.id,
        code: updateError.code,
      });
    }

    logger.info("Offer generated via workflow", { systemId, userId: user.id });

    return { offer, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Offer generation failed", { systemId, error: msg });
    return { offer: null, error: "Offer generation failed. Please try again." };
  }
}
