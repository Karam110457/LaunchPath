"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  OFFER_SYSTEM_PROMPT,
  buildOfferContext,
} from "@/lib/ai/offer-prompt";
import { logger } from "@/lib/security/logger";

interface OfferDetailsResult {
  transformation_from: string | null;
  transformation_to: string | null;
  system_description: string | null;
  guarantee: string | null;
  error: string | null;
}

/**
 * Generate offer details (transformation copy + guarantee) using AI.
 * Pricing is NOT generated here — it's calculated client-side from profile data.
 */
export async function generateOfferDetails(
  systemId: string
): Promise<OfferDetailsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.error("ANTHROPIC_API_KEY not configured");
    return {
      transformation_from: null,
      transformation_to: null,
      system_description: null,
      guarantee: null,
      error: "AI service not configured.",
    };
  }

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
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: OFFER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContext }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      logger.error("Offer AI response contained no text", { systemId });
      return {
        transformation_from: null,
        transformation_to: null,
        system_description: null,
        guarantee: null,
        error: "AI returned an empty response.",
      };
    }

    const raw = textBlock.text.trim();
    let parsed: {
      transformation_from: string;
      transformation_to: string;
      system_description: string;
      guarantee: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        logger.error("Offer AI response was not valid JSON", {
          systemId,
          responsePreview: raw.slice(0, 200),
        });
        return {
          transformation_from: null,
          transformation_to: null,
          system_description: null,
          guarantee: null,
          error: "AI returned an invalid response. Please try again.",
        };
      }
    }

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
