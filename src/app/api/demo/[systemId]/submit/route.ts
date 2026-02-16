import { createClient } from "@/lib/supabase/server";
import { validateBody, jsonErrorResponse } from "@/lib/api/validate";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { demoSubmissionSchema } from "@/lib/validations/demo-submission";
import { findAgentSlug } from "@/lib/ai/agents/registry";
import { demoResultSchema } from "@/lib/ai/schemas";
import { demoAgents } from "@/mastra/agents/demo-agents";
import { logger } from "@/lib/security/logger";

/**
 * POST /api/demo/[systemId]/submit
 * Public endpoint — no auth required. Rate limited: 10 req/min per IP.
 * Processes a demo form submission through the niche-specific Mastra agent.
 * Returns a streaming text response.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const { systemId } = await params;

  // Rate limit
  const ip = getClientIdentifier(request);
  const rl = rateLimit(ip, `/api/demo/${systemId}/submit`, 10);
  if (!rl.success) {
    return jsonErrorResponse(
      `Too many requests. Try again in ${rl.retryAfter}s.`,
      429
    );
  }

  // Validate body
  const { data, error: validationError } = await validateBody(
    request,
    demoSubmissionSchema
  );
  if (validationError) return validationError;

  // Fetch system
  const supabase = await createClient();
  const { data: system, error: fetchError } = await supabase
    .from("user_systems")
    .select("id, status, chosen_recommendation")
    .eq("id", systemId)
    .eq("status", "complete")
    .single();

  if (fetchError || !system) {
    return jsonErrorResponse("Demo not found.", 404);
  }

  const chosenRec = system.chosen_recommendation as {
    niche: string;
  } | null;

  if (!chosenRec) {
    return jsonErrorResponse("Demo not configured.", 404);
  }

  // Look up Mastra agent
  const agentSlug = findAgentSlug(chosenRec.niche);
  if (!agentSlug) {
    return jsonErrorResponse("Agent not found for this niche.", 404);
  }

  const agent = demoAgents[`demo-${agentSlug}`];
  if (!agent) {
    return jsonErrorResponse("Agent not found for this niche.", 404);
  }

  try {
    const userMessage = `Analyse this submission and return your assessment as JSON.\n\nForm data:\n${JSON.stringify(data.form_data, null, 2)}`;

    const stream = await agent.stream(userMessage, {
      structuredOutput: { schema: demoResultSchema },
    });

    // Save to DB when structured output is ready (fire-and-forget)
    stream.object
      .then(async (result) => {
        const { error: insertError } = await supabase
          .from("demo_submissions")
          .insert({
            system_id: systemId,
            form_data: data.form_data,
            result,
            ip_address: ip,
          });

        if (insertError) {
          logger.error("Failed to save demo submission", {
            systemId,
            code: insertError.code,
          });
        }
      })
      .catch((err) => {
        logger.error("Demo structured output failed", {
          systemId,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return new Response(stream.textStream as ReadableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Demo AI call failed", { systemId, error: msg });
    return jsonErrorResponse("Analysis failed. Please try again.", 500);
  }
}
