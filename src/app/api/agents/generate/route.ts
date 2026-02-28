import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import { agentGenerationOutputSchema } from "@/lib/ai/schemas";
import { buildAgentGenerationContext } from "@/lib/ai/agent-builder-prompt";
import { getTemplateById } from "@/lib/agents/templates";
import { withRateLimitRetry } from "@/lib/ai/rate-limit-retry";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    prompt?: string;
    templateId?: string;
    systemId?: string;
    wizardConfig?: {
      templateId: string;
      systemId?: string;
      businessDescription?: string;
      behaviorConfig: Record<string, unknown>;
      personality: { tone: string; greeting_message: string };
    };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, wizardConfig } = body;
  // Wizard config can provide templateId and systemId
  const templateId = body.wizardConfig?.templateId ?? body.templateId;
  const systemId = body.wizardConfig?.systemId ?? body.systemId;

  if (!prompt && !templateId && !wizardConfig) {
    return NextResponse.json(
      { error: "Prompt, template, or wizard config required" },
      { status: 400 },
    );
  }

  // Optionally fetch business context (for prompt-based flow)
  let businessContext: {
    niche: string;
    segment: string;
    offer_description: string;
  } | null = null;

  if (systemId && !wizardConfig) {
    const { data: system } = await supabase
      .from("user_systems")
      .select("chosen_recommendation, offer")
      .eq("id", systemId)
      .eq("user_id", user.id)
      .single();

    if (system) {
      const rec = system.chosen_recommendation as {
        niche?: string;
        target_segment?: { description?: string };
      } | null;
      const offer = system.offer as {
        segment?: string;
        system_description?: string;
      } | null;
      businessContext = {
        niche: rec?.niche ?? "",
        segment: offer?.segment ?? rec?.target_segment?.description ?? "",
        offer_description: offer?.system_description ?? "",
      };
    }
  }

  // Get template context (for prompt-based flow)
  const template = templateId ? getTemplateById(templateId) : null;
  const templateContext =
    template && !wizardConfig
      ? {
          name: template.name,
          default_system_prompt_hint: template.default_system_prompt_hint,
          default_tools: template.default_tools,
          suggested_personality: template.suggested_personality,
        }
      : null;

  const context = buildAgentGenerationContext({
    userPrompt: prompt ?? "",
    templateContext,
    businessContext,
    wizardConfig: wizardConfig ?? null,
  });

  const encoder = new TextEncoder();

  const sseStream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        enqueue({ type: "progress", label: "Understanding your requirements..." });

        const agent = mastra.getAgent("agent-builder");
        const result = await withRateLimitRetry(() =>
          agent.generate(context, {
            structuredOutput: { schema: agentGenerationOutputSchema },
          }),
        );

        enqueue({ type: "progress", label: "Crafting your agent..." });

        const agentConfig = result.object;

        if (!agentConfig) {
          enqueue({ type: "error", error: "Failed to generate agent config." });
          return;
        }

        enqueue({ type: "progress", label: "Saving your agent..." });

        const { data: newAgent, error: insertError } = await supabase
          .from("ai_agents")
          .insert({
            user_id: user.id,
            system_id: systemId ?? null,
            name: agentConfig.name,
            description: agentConfig.description,
            system_prompt: agentConfig.system_prompt,
            personality: agentConfig.personality,
            enabled_tools: agentConfig.suggested_tools,
            template_id: templateId ?? null,
            model: "claude-sonnet-4-5-20250929",
            status: "draft",
          })
          .select("id")
          .single();

        if (insertError || !newAgent) {
          logger.error("Failed to save agent", {
            error: insertError?.message,
            userId: user.id,
          });
          enqueue({
            type: "error",
            error: "Failed to save agent. Please try again.",
          });
        } else {
          logger.info("Agent created", {
            agentId: newAgent.id,
            userId: user.id,
            templateId: templateId ?? null,
          });
          enqueue({
            type: "complete",
            agent: { ...agentConfig, id: newAgent.id },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Agent generation failed", {
          error: msg,
          userId: user.id,
        });
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
