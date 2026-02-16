"use server";

import { createClient } from "@/lib/supabase/server";
import { findAgentSlug } from "@/lib/ai/agents/registry";
import { logger } from "@/lib/security/logger";

interface GenerateSystemResult {
  demo_url: string | null;
  error: string | null;
}

/**
 * Generate the system: maps chosen niche to an agent, creates a unique demo URL,
 * and marks the system as complete.
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
    return { demo_url: null, error: "Not authenticated." };
  }

  const { data: system, error: fetchError } = await supabase
    .from("user_systems")
    .select("id, chosen_recommendation, offer")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !system) {
    return { demo_url: null, error: "System not found." };
  }

  const chosenRec = system.chosen_recommendation as {
    niche: string;
    score: number;
  } | null;

  if (!chosenRec) {
    return { demo_url: null, error: "No niche selected." };
  }

  // Map niche name to agent slug
  const agentSlug = findAgentSlug(chosenRec.niche);
  if (!agentSlug) {
    logger.warn("No agent found for niche", {
      niche: chosenRec.niche,
      systemId,
    });
    // Fallback: use a sanitised slug from the niche name
  }

  // Generate unique demo URL path
  const slug = agentSlug ?? chosenRec.niche.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const shortId = systemId.slice(0, 8);
  const demoUrl = `/demo/${systemId}`;

  // Update system with demo URL and mark complete
  const { error: updateError } = await supabase
    .from("user_systems")
    .update({
      demo_url: demoUrl,
      status: "complete",
    })
    .eq("id", systemId)
    .eq("user_id", user.id);

  if (updateError) {
    logger.error("Failed to save demo URL", {
      systemId,
      userId: user.id,
      code: updateError.code,
    });
    return { demo_url: null, error: "Failed to generate system." };
  }

  logger.info("System generated", {
    systemId,
    userId: user.id,
    agentSlug: agentSlug ?? "fallback",
    demoUrl,
  });

  return { demo_url: demoUrl, error: null };
}
