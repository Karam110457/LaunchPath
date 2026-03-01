import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import { agentGenerationOutputSchema } from "@/lib/ai/schemas";
import { buildAgentGenerationContext } from "@/lib/ai/agent-builder-prompt";
import { getTemplateById } from "@/lib/agents/templates";
import { withRateLimitRetry } from "@/lib/ai/rate-limit-retry";
import { chunkText } from "@/lib/knowledge/chunking";
import { embedTexts } from "@/lib/knowledge/embeddings";
import type { SupabaseClient } from "@supabase/supabase-js";

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
      agentName?: string;
      agentDescription?: string;
      behaviorConfig: Record<string, unknown>;
      personality: { tone: string; greeting_message: string };
      qualifyingQuestions?: string[];
      faqs?: Array<{ question: string; answer: string }>;
      scrapedPages?: Array<{ url: string; title: string; content: string }>;
      files?: Array<{ name: string; extractedText: string }>;
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
          // Post-generation: process wizard knowledge data
          if (wizardConfig) {
            const knowledgeItems = [
              ...(wizardConfig.scrapedPages ?? []),
              ...(wizardConfig.faqs ?? []),
              ...(wizardConfig.files ?? []),
            ];
            if (knowledgeItems.length > 0) {
              enqueue({ type: "progress", label: "Processing knowledge base..." });
              await processWizardKnowledge(
                supabase,
                newAgent.id,
                user.id,
                wizardConfig,
              );
            }
          }

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

// ---------------------------------------------------------------------------
// Post-generation knowledge processing
// ---------------------------------------------------------------------------

async function processWizardKnowledge(
  supabase: SupabaseClient,
  agentId: string,
  userId: string,
  wizardConfig: {
    scrapedPages?: Array<{ url: string; title: string; content: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    files?: Array<{ name: string; extractedText: string }>;
  },
) {
  try {
    // 1. Process scraped pages
    for (const page of wizardConfig.scrapedPages ?? []) {
      if (!page.content) continue;

      const { data: doc } = await supabase
        .from("agent_knowledge_documents")
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: page.title || page.url,
          source_type: "website",
          source_url: page.url,
          status: "processing",
        })
        .select("id")
        .single();

      if (!doc) continue;

      const chunks = chunkText(page.content);
      if (chunks.length === 0) {
        await supabase
          .from("agent_knowledge_documents")
          .update({ status: "ready", chunk_count: 0 })
          .eq("id", doc.id);
        continue;
      }

      const texts = chunks.map((c) => c.content);
      const embeddings = await embedTexts(texts);
      const chunkRows = texts.map((text, i) => ({
        document_id: doc.id,
        agent_id: agentId,
        content: text,
        embedding: JSON.stringify(embeddings[i]),
        chunk_index: i,
      }));

      await supabase.from("agent_knowledge_chunks").insert(chunkRows);
      await supabase
        .from("agent_knowledge_documents")
        .update({ status: "ready", chunk_count: chunks.length })
        .eq("id", doc.id);
    }

    // 2. Process FAQs (each FAQ becomes a single-chunk document)
    for (const faq of wizardConfig.faqs ?? []) {
      const content = `Q: ${faq.question}\nA: ${faq.answer}`;

      const { data: doc } = await supabase
        .from("agent_knowledge_documents")
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: faq.question,
          source_type: "faq",
          status: "processing",
        })
        .select("id")
        .single();

      if (!doc) continue;

      const embeddings = await embedTexts([content]);
      await supabase.from("agent_knowledge_chunks").insert({
        document_id: doc.id,
        agent_id: agentId,
        content,
        embedding: JSON.stringify(embeddings[0]),
        chunk_index: 0,
      });

      await supabase
        .from("agent_knowledge_documents")
        .update({ status: "ready", chunk_count: 1 })
        .eq("id", doc.id);
    }

    // 3. Process uploaded files (text already extracted client-side)
    for (const file of wizardConfig.files ?? []) {
      if (!file.extractedText) continue;

      const { data: doc } = await supabase
        .from("agent_knowledge_documents")
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: file.name,
          source_type: "file",
          status: "processing",
        })
        .select("id")
        .single();

      if (!doc) continue;

      const chunks = chunkText(file.extractedText);
      if (chunks.length === 0) {
        await supabase
          .from("agent_knowledge_documents")
          .update({ status: "ready", chunk_count: 0 })
          .eq("id", doc.id);
        continue;
      }

      const fileTexts = chunks.map((c) => c.content);
      const embeddings = await embedTexts(fileTexts);
      const chunkRows = fileTexts.map((text, i) => ({
        document_id: doc.id,
        agent_id: agentId,
        content: text,
        embedding: JSON.stringify(embeddings[i]),
        chunk_index: i,
      }));

      await supabase.from("agent_knowledge_chunks").insert(chunkRows);
      await supabase
        .from("agent_knowledge_documents")
        .update({ status: "ready", chunk_count: chunks.length })
        .eq("id", doc.id);
    }
  } catch (err) {
    // Knowledge processing is best-effort — log but don't fail the agent creation
    logger.error("Knowledge processing failed", {
      agentId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
