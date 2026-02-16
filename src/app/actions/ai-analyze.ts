"use server";

import { createClient } from "@/lib/supabase/server";
import { buildUserContext } from "@/lib/ai/serge-prompt";
import { nicheAnalysisOutputSchema } from "@/lib/ai/schemas";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import type { AIRecommendation } from "@/lib/ai/schemas";

interface AnalyzeResult {
  recommendations: AIRecommendation[] | null;
  reasoning: string | null;
  error: string | null;
}

/**
 * Run AI niche analysis for a system.
 * Calls the Serge Mastra agent with structured output.
 * Saves results to user_systems.ai_recommendations.
 */
export async function runNicheAnalysis(
  systemId: string
): Promise<AnalyzeResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { recommendations: null, reasoning: null, error: "Not authenticated." };
  }

  // Fetch system + profile in parallel
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
    return { recommendations: null, reasoning: null, error: "System not found." };
  }
  if (profileResult.error || !profileResult.data) {
    return { recommendations: null, reasoning: null, error: "Profile not found." };
  }

  const system = systemResult.data;
  const profile = profileResult.data;

  // Determine recommendation count based on profile
  const keepsSwitching = (profile.blockers ?? []).includes("keep_switching");
  const recommendationCount = keepsSwitching ? 1 : 3;

  // Build user context from profile + system answers
  const userContext = buildUserContext(
    {
      time_availability: profile.time_availability,
      outreach_comfort: profile.outreach_comfort,
      technical_comfort: profile.technical_comfort,
      revenue_goal: profile.revenue_goal,
      current_situation: profile.current_situation,
      blockers: profile.blockers ?? [],
    },
    {
      intent: system.intent,
      direction_path: system.direction_path,
      industry_interests: system.industry_interests ?? [],
      own_idea: system.own_idea,
      tried_niche: system.tried_niche,
      what_went_wrong: system.what_went_wrong,
      current_niche: system.current_niche,
      current_clients: system.current_clients,
      current_pricing: system.current_pricing,
      growth_direction: system.growth_direction,
      delivery_model: system.delivery_model,
      pricing_direction: system.pricing_direction,
      location_city: system.location_city,
      location_target: system.location_target,
    },
    recommendationCount
  );

  try {
    const agent = mastra.getAgent("serge");
    const result = await agent.generate(userContext, {
      structuredOutput: { schema: nicheAnalysisOutputSchema },
    });

    const parsed = result.object;

    if (!parsed || !Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      logger.error("AI response missing recommendations", { systemId });
      return {
        recommendations: null,
        reasoning: null,
        error: "AI returned no recommendations. Please try again.",
      };
    }

    // Save to database
    const { error: updateError } = await supabase
      .from("user_systems")
      .update({
        ai_recommendations: parsed.recommendations as unknown as Record<string, unknown>[],
      })
      .eq("id", systemId)
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Failed to save AI recommendations", {
        systemId,
        userId: user.id,
        code: updateError.code,
      });
      return {
        recommendations: null,
        reasoning: null,
        error: "Failed to save recommendations.",
      };
    }

    logger.info("AI niche analysis complete", {
      systemId,
      userId: user.id,
      count: parsed.recommendations.length,
    });

    return {
      recommendations: parsed.recommendations,
      reasoning: parsed.reasoning ?? null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("AI analysis failed", { systemId, error: message });
    return {
      recommendations: null,
      reasoning: null,
      error: "AI analysis failed. Please try again.",
    };
  }
}

/**
 * Save the user's chosen recommendation to the system.
 */
export async function chooseRecommendation(
  systemId: string,
  recommendation: AIRecommendation
): Promise<{ error: string | null }> {
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
    .update({
      chosen_recommendation: recommendation as unknown as Record<string, unknown>,
    })
    .eq("id", systemId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Failed to save chosen recommendation", {
      systemId,
      userId: user.id,
      code: error.code,
    });
    return { error: "Failed to save selection." };
  }

  return { error: null };
}
