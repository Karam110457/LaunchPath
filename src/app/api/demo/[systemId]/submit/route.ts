import { createClient } from "@/lib/supabase/server";
import { validateBody, jsonErrorResponse } from "@/lib/api/validate";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { demoSubmissionSchema } from "@/lib/validations/demo-submission";
import { findAgentSlug } from "@/lib/ai/agents/registry";
import { demoResultSchema } from "@/lib/ai/schemas";
import { getDemoAgent } from "@/mastra/agents/demo-agents";
import { logger } from "@/lib/security/logger";

/**
 * POST /api/demo/[systemId]/submit
 * Public endpoint — no auth required. Rate limited: 10 req/min per IP.
 * Processes a demo form submission through the niche-specific Mastra agent.
 * Returns an SSE stream with staged progress events and the final result.
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
    your_solution?: string;
  } | null;

  if (!chosenRec) {
    return jsonErrorResponse("Demo not configured.", 404);
  }

  // Look up Mastra agent (falls back to dynamic agent for custom niches)
  const agentSlug = findAgentSlug(chosenRec.niche);
  const { agent } = getDemoAgent(
    agentSlug,
    chosenRec.niche,
    chosenRec.your_solution
  );

  const encoder = new TextEncoder();

  const sseStream = new ReadableStream({
    async start(controller) {
      const write = (payload: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const delay = (ms: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, ms));

      try {
        // Stage 1: Reading data
        write({ type: "step-active", stepId: "reading" });
        await delay(400);
        write({ type: "step-done", stepId: "reading" });

        // Stage 2: Scoring — start AI call
        write({ type: "step-active", stepId: "scoring" });

        const userMessage = `Analyse this submission and return your assessment as JSON.\n\nForm data:\n${JSON.stringify(data.form_data, null, 2)}`;

        const aiStream = await agent.stream(userMessage, {
          structuredOutput: { schema: demoResultSchema },
        });

        // Wait for the structured output to resolve
        const result = await aiStream.object;

        write({ type: "step-done", stepId: "scoring" });

        // Stage 3: Generating insights
        write({ type: "step-active", stepId: "insights" });
        await delay(500);
        write({ type: "step-done", stepId: "insights" });

        // Stage 4: Preparing report
        write({ type: "step-active", stepId: "report" });
        await delay(400);
        write({ type: "step-done", stepId: "report" });

        // Complete with result
        write({ type: "complete", result });

        // Fire-and-forget save to DB
        supabase
          .from("demo_submissions")
          .insert({
            system_id: systemId,
            form_data: data.form_data,
            result,
            ip_address: ip,
          })
          .then(({ error: insertError }) => {
            if (insertError) {
              logger.error("Failed to save demo submission", {
                systemId,
                code: insertError.code,
              });
            }
          });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Demo AI call failed", { systemId, error: msg });
        write({ type: "error", error: "Analysis failed. Please try again." });
      }

      controller.close();
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
