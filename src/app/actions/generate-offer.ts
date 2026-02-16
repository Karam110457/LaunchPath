"use server";

import { createClient } from "@/lib/supabase/server";
import { buildOfferContext } from "@/lib/ai/offer-prompt";
import { offerDetailsOutputSchema } from "@/lib/ai/schemas";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";

interface OfferDetailsResult {
  transformation_from: string | null;
  transformation_to: string | null;
  system_description: string | null;
  guarantee: string | null;
  error: string | null;
}

/**
 * Generate offer details (transformation copy + guarantee) using the Mastra offer agent.
 * Pricing is NOT generated here — it's calculated client-side from profile data.
 */
export async function generateOfferDetails(
  systemId: string
): Promise<OfferDetailsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      transformation_from: null,
      transformation_to: null,
      system_description: null,
      guarantee: null,
      error: "Not authenticated.",
    };
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
    return {
      transformation_from: null,
      transformation_to: null,
      system_description: null,
      guarantee: null,
      error: "System not found.",
    };
  }
  if (profileResult.error || !profileResult.data) {
    return {
      transformation_from: null,
      transformation_to: null,
      system_description: null,
      guarantee: null,
      error: "Profile not found.",
    };
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
      transformation_from: null,
      transformation_to: null,
      system_description: null,
      guarantee: null,
      error: "No niche selected. Go back and choose a recommendation.",
    };
  }

  const userContext = buildOfferContext(
    chosenRec,
    {
      time_availability: profile.time_availability,
      revenue_goal: profile.revenue_goal,
      blockers: profile.blockers ?? [],
    },
    {
      delivery_model: system.delivery_model,
      pricing_direction: system.pricing_direction,
      location_city: system.location_city,
    }
  );

  try {
    const agent = mastra.getAgent("offer");
    const result = await agent.generate(userContext, {
      structuredOutput: { schema: offerDetailsOutputSchema },
    });

    const parsed = result.object;

    logger.info("Offer details generated", { systemId, userId: user.id });

    return {
      transformation_from: parsed.transformation_from,
      transformation_to: parsed.transformation_to,
      system_description: parsed.system_description,
      guarantee: parsed.guarantee,
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Offer generation failed", { systemId, error: msg });
    return {
      transformation_from: null,
      transformation_to: null,
      system_description: null,
      guarantee: null,
      error: "Offer generation failed. Please try again.",
    };
  }
}
