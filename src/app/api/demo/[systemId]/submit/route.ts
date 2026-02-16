import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { validateBody, jsonErrorResponse } from "@/lib/api/validate";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { demoSubmissionSchema } from "@/lib/validations/demo-submission";
import { getAgentForNiche, findAgentSlug } from "@/lib/ai/agents/registry";
import { logger } from "@/lib/security/logger";

/**
 * POST /api/demo/[systemId]/submit
 * Public endpoint — no auth required. Rate limited: 10 req/min per IP.
 * Processes a demo form submission through the niche-specific AI agent.
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

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.error("ANTHROPIC_API_KEY not configured for demo submission");
    return jsonErrorResponse("AI service not configured.", 503);
  }

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

  // Look up agent
  const agentSlug = findAgentSlug(chosenRec.niche);
  const agent = agentSlug ? getAgentForNiche(agentSlug) : null;

  if (!agent) {
    return jsonErrorResponse("Agent not found for this niche.", 404);
  }

  // Call AI with agent's system prompt + form data
  try {
    const client = new Anthropic({ apiKey });

    const userMessage = `Analyse this submission and return your assessment as JSON.\n\nForm data:\n${JSON.stringify(data.form_data, null, 2)}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: agent.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      logger.error("Demo AI response contained no text", { systemId });
      return jsonErrorResponse("AI returned an empty response.", 500);
    }

    const raw = textBlock.text.trim();
    let result: Record<string, unknown>;

    try {
      result = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        logger.error("Demo AI response was not valid JSON", {
          systemId,
          responsePreview: raw.slice(0, 200),
        });
        return jsonErrorResponse("AI returned an invalid response.", 500);
      }
    }

    // Save submission to database
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
      // Don't fail the request — still return the result
    }

    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Demo AI call failed", { systemId, error: msg });
    return jsonErrorResponse("Analysis failed. Please try again.", 500);
  }
}
