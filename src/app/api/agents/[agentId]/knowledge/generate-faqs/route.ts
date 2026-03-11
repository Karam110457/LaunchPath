import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { wizardFaqOutputSchema } from "@/lib/ai/schemas";
import { withRateLimitRetry } from "@/lib/ai/rate-limit-retry";

/**
 * POST /api/agents/[agentId]/knowledge/generate-faqs
 *
 * Generates FAQs using AI based on the agent's existing knowledge base
 * documents (websites, files, existing FAQs) and optional extra context.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  const rl = rateLimit(
    getClientIdentifier(request),
    `agents/${agentId}/generate-faqs`,
    5,
  );
  if (!rl.success) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfter}s.` },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify agent ownership
  const { data: agent, error: agentErr } = await supabase
    .from("ai_agents")
    .select("id, description")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (agentErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  let body: { extraContext?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Gather existing knowledge documents as context
  const { data: docs } = await supabase
    .from("agent_knowledge_documents")
    .select("source_type, source_name, content")
    .eq("agent_id", agentId)
    .eq("status", "ready")
    .order("created_at", { ascending: true });

  const docTexts = (docs ?? [])
    .filter((d) => d.content)
    .map((d) => {
      const label =
        d.source_type === "faq"
          ? "Existing FAQ"
          : d.source_type === "website"
            ? `Website: ${d.source_name}`
            : `File: ${d.source_name}`;
      return `[${label}]\n${d.content}`;
    });

  const contextParts: string[] = [];
  if (agent.description) {
    contextParts.push(`Agent description: ${agent.description}`);
  }
  if (body.extraContext?.trim()) {
    contextParts.push(`Additional context:\n${body.extraContext.trim()}`);
  }
  if (docTexts.length > 0) {
    contextParts.push(`Knowledge base content:\n\n${docTexts.join("\n\n---\n\n")}`);
  }

  if (contextParts.length === 0) {
    return NextResponse.json(
      {
        error:
          "No knowledge content found. Add documents, websites, or a description first.",
      },
      { status: 400 },
    );
  }

  const prompt = contextParts.join("\n\n---\n\n");

  try {
    const faqAgent = mastra.getAgent("wizard-faq-generator");
    const result = await withRateLimitRetry(() =>
      faqAgent.generate(
        `Generate FAQs based on the following:\n\n${prompt}`,
        { structuredOutput: { schema: wizardFaqOutputSchema } },
      ),
    );

    const output = result.object;
    if (!output || !output.faqs) {
      return NextResponse.json(
        { error: "Failed to generate FAQs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ faqs: output.faqs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "FAQ generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
