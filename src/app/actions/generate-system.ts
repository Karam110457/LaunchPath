"use server";

import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import type { DemoConfig, AssembledOffer } from "@/lib/ai/schemas";

interface GenerateSystemResult {
  demo_url: string | null;
  demo_config: DemoConfig | null;
  error: string | null;
}

/**
 * Generate the system: runs the demo-builder workflow to create a dynamic
 * demo page configuration from the user's offer and niche recommendation.
 * Saves the config, sets the demo URL, and marks the system as complete.
 */
export async function generateSystem(
  systemId: string
): Promise<GenerateSystemResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { demo_url: null, demo_config: null, error: "Not authenticated." };
  }

  const { data: system, error: fetchError } = await supabase
    .from("user_systems")
    .select("id, chosen_recommendation, offer")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !system) {
    return { demo_url: null, demo_config: null, error: "System not found." };
  }

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
    return { demo_url: null, demo_config: null, error: "No niche selected." };
  }

  const offer = system.offer as AssembledOffer | null;
  if (!offer) {
    return {
      demo_url: null,
      demo_config: null,
      error: "Offer not found. Complete the offer step first.",
    };
  }

  try {
    const workflow = mastra.getWorkflow("demo-builder");
    const run = await workflow.createRun();
    const result = await run.start({
      inputData: {
        chosenRecommendation: chosenRec,
        offer: {
          segment: offer.segment ?? "",
          transformation_from: offer.transformation_from ?? "",
          transformation_to: offer.transformation_to ?? "",
          system_description: offer.system_description ?? "",
          guarantee_text: offer.guarantee_text ?? "",
          guarantee_type: offer.guarantee_type ?? "",
          pricing_setup: offer.pricing_setup ?? 0,
          pricing_monthly: offer.pricing_monthly ?? 0,
          pricing_rationale: offer.pricing_rationale ?? "",
          delivery_model: offer.delivery_model ?? "not specified",
        },
      },
    });

    if (result.status !== "success") {
      logger.error("Demo builder workflow failed", {
        systemId,
        userId: user.id,
        status: result.status,
      });
      return {
        demo_url: null,
        demo_config: null,
        error: "System generation failed. Please try again.",
      };
    }

    const demoConfig = result.result;
    const demoUrl = `/demo/${systemId}`;

    // Save config, URL, and mark complete
    const { error: updateError } = await supabase
      .from("user_systems")
      .update({
        demo_config: demoConfig as unknown as Record<string, unknown>,
        demo_url: demoUrl,
        status: "complete",
      })
      .eq("id", systemId)
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Failed to save demo config", {
        systemId,
        userId: user.id,
        code: updateError.code,
      });
      return {
        demo_url: null,
        demo_config: null,
        error: "Failed to save system.",
      };
    }

    logger.info("System generated with demo config", {
      systemId,
      userId: user.id,
      nicheSlug: demoConfig.niche_slug,
      demoUrl,
    });

    return { demo_url: demoUrl, demo_config: demoConfig, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("System generation failed", { systemId, error: msg });
    return {
      demo_url: null,
      demo_config: null,
      error: "System generation failed. Please try again.",
    };
  }
}
