"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { SERGE_SYSTEM_PROMPT, buildUserContext } from "@/lib/ai/serge-prompt";
import { logger } from "@/lib/security/logger";
import type { AIRecommendation } from "@/types/start-business";

interface AnalyzeResult {
  recommendations: AIRecommendation[] | null;
  reasoning: string | null;
  error: string | null;
}

/**
 * Run AI niche analysis for a system.
 * Calls Sonnet 4.5 with the Serge framework prompt + user context.
 * Saves results to user_systems.ai_recommendations.
 */
export async function runNicheAnalysis(
  systemId: string
): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.error("ANTHROPIC_API_KEY not configured");
    return { recommendations: null, reasoning: null, error: "AI service not configured." };
  }

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
  // Users who keep switching get 1 directive recommendation
  // Beginners get 3 to explore
  // Everyone else gets 3
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
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SERGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContext }],
    });

    // Extract text content from response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      logger.error("AI response contained no text", { systemId });
      return { recommendations: null, reasoning: null, error: "AI returned an empty response." };
    }

    // Parse JSON from the response
    const raw = textBlock.text.trim();
    let parsed: { recommendations: AIRecommendation[]; reasoning: string };

    try {
      parsed = JSON.parse(raw);
    } catch {
      // Sometimes the model wraps JSON in markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        logger.error("AI response was not valid JSON", {
          systemId,
          responsePreview: raw.slice(0, 200),
        });
        return {
          recommendations: null,
          reasoning: null,
          error: "AI returned an invalid response. Please try again.",
        };
      }
    }

    // Validate the structure
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      logger.error("AI response missing recommendations array", { systemId });
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
