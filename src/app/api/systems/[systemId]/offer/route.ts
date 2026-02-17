/**
 * Streaming endpoint for offer workflow progress.
 * POST /api/systems/[systemId]/offer
 *
 * Uses Mastra's run.stream() to surface real-time progress to the UI.
 * Emits typed SSE events:
 *   { type: "progress", label: "...", stepId: "..." }  — a step is running
 *   { type: "step-complete", stepId: "..." }           — a step finished
 *   { type: "complete", offer: {...} }                 — workflow done
 *   { type: "error", error: "..." }                    — something failed
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";

// Human-readable step labels for the offer generation workflow
const OFFER_STEP_LABELS: Record<string, string> = {
  "prepare-prompts": "Reading your niche and profile...",
  "generate-transformation": "Writing your transformation story...",
  "generate-guarantee": "Crafting your guarantee...",
  "generate-pricing": "Setting your pricing...",
  "assemble-offer": "Assembling your offer...",
  "validate-offer": "Final review...",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const { systemId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }
  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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
    return NextResponse.json({ error: "No niche selected" }, { status: 400 });
  }

  // Return pre-generated offer immediately if available
  if (system.offer && typeof system.offer === "object") {
    const existing = system.offer as Record<string, unknown>;
    if (existing.transformation_from && existing.guarantee_text) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "progress", label: "Loading your offer..." })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "complete", offer: system.offer })}\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  }

  const workflow = mastra.getWorkflow("offer-generation");
  const run = await workflow.createRun();

  const encoder = new TextEncoder();
  const sseStream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const workflowStream = run.stream({
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

        for await (const chunk of workflowStream) {
          const c = chunk as unknown as Record<string, unknown>;
          const chunkType = c.type as string | undefined;

          if (chunkType === "workflow-step-start") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              const label = OFFER_STEP_LABELS[stepName] ?? `${stepName}...`;
              enqueue({ type: "progress", label, stepId: stepName });
            }
          } else if (chunkType === "workflow-step-result") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              enqueue({ type: "step-complete", stepId: stepName });
            }
          } else if (chunkType === "step-progress") {
            // Custom writer events emitted from within workflow steps
            const label = c.label as string | undefined;
            const stepId = c.stepId as string | undefined;
            const done = c.done as boolean | undefined;
            if (label) {
              enqueue({ type: "progress", label, stepId, done });
            }
          }
        }

        const finalResult = await workflowStream.result;

        if (finalResult.status === "success") {
          const offer = finalResult.result;

          await supabase
            .from("user_systems")
            .update({ offer: offer as unknown as Record<string, unknown> })
            .eq("id", systemId)
            .eq("user_id", user.id);

          enqueue({ type: "complete", offer });
        } else {
          logger.error("Offer workflow failed", {
            systemId,
            userId: user.id,
            status: finalResult.status,
          });
          enqueue({ type: "error", error: "Offer generation failed. Please try again." });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Offer SSE stream failed", { systemId, error: msg });
        enqueue({ type: "error", error: msg });
      } finally {
        controller.close();
      }
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
