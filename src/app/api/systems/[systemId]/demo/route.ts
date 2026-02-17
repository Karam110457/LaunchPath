/**
 * Streaming endpoint for demo builder workflow progress.
 * POST /api/systems/[systemId]/demo
 *
 * Uses Mastra's run.stream() to surface real-time progress to the UI.
 * Emits typed SSE events:
 *   { type: "progress", label: "...", stepId: "..." }    — a step is running
 *   { type: "step-complete", stepId: "..." }             — a step finished
 *   { type: "complete", demo_config: {...}, demo_url: "..." } — workflow done
 *   { type: "error", error: "..." }                      — something failed
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import type { AssembledOffer } from "@/lib/ai/schemas";

const DEMO_STEP_LABELS: Record<string, string> = {
  "generate-demo-config": "Designing your demo page...",
  "validate-demo-config": "Reviewing your demo page...",
};

export async function POST(
  _request: NextRequest,
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

  const { data: system, error: fetchError } = await supabase
    .from("user_systems")
    .select("id, chosen_recommendation, offer")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !system) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
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
    return NextResponse.json({ error: "No niche selected" }, { status: 400 });
  }

  const offer = system.offer as AssembledOffer | null;
  if (!offer) {
    return NextResponse.json(
      { error: "Offer not found. Complete the offer step first." },
      { status: 400 }
    );
  }

  const workflow = mastra.getWorkflow("demo-builder");
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

        for await (const chunk of workflowStream) {
          const c = chunk as unknown as Record<string, unknown>;
          const chunkType = c.type as string | undefined;

          if (chunkType === "workflow-step-start") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              const label = DEMO_STEP_LABELS[stepName] ?? `${stepName}...`;
              enqueue({ type: "progress", label, stepId: stepName });
            }
          } else if (chunkType === "workflow-step-result") {
            const payload = c.payload as Record<string, unknown> | undefined;
            const stepName = payload?.stepName as string | undefined;
            if (stepName) {
              enqueue({ type: "step-complete", stepId: stepName });
            }
          } else if (chunkType === "step-progress") {
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
          const demoConfig = finalResult.result;
          const demoUrl = `/demo/${systemId}`;

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
            enqueue({ type: "error", error: "Failed to save your system." });
            return;
          }

          logger.info("Demo config generated via stream", {
            systemId,
            userId: user.id,
            nicheSlug: demoConfig.niche_slug,
          });

          enqueue({ type: "complete", demo_config: demoConfig, demo_url: demoUrl });
        } else {
          logger.error("Demo builder workflow failed", {
            systemId,
            userId: user.id,
            status: finalResult.status,
          });
          enqueue({ type: "error", error: "System generation failed. Please try again." });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Demo SSE stream failed", { systemId, error: msg });
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
