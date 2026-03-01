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
            const pageCount = wizardConfig.scrapedPages?.length ?? 0;
            const faqCount = wizardConfig.faqs?.length ?? 0;
            const fileCount = wizardConfig.files?.length ?? 0;
            const totalKnowledge = pageCount + faqCount + fileCount;

            logger.info("Wizard knowledge payload", {
              agentId: newAgent.id,
              pages: pageCount,
              faqs: faqCount,
              files: fileCount,
            });

            if (totalKnowledge > 0) {
              enqueue({ type: "progress", label: `Processing knowledge base (${totalKnowledge} items)...` });
              await processWizardKnowledge(
                supabase,
                newAgent.id,
                user.id,
                wizardConfig,
                enqueue,
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
  enqueue: (event: Record<string, unknown>) => void,
) {
  let processed = 0;
  let failed = 0;

  // Helper to insert a document, embed + chunk it, and mark ready
  async function insertKnowledgeDoc(
    sourceName: string,
    sourceType: "website" | "faq" | "file",
    content: string,
  ) {
    const { data: doc, error: docError } = await supabase
      .from("agent_knowledge_documents")
      .insert({
        agent_id: agentId,
        user_id: userId,
        source_name: sourceName,
        source_type: sourceType,
        content: content.slice(0, 10000),
        status: "processing",
      })
      .select("id")
      .single();

    if (docError || !doc) {
      logger.error("Failed to insert knowledge document", {
        agentId,
        sourceName,
        sourceType,
        error: docError?.message ?? "No doc returned",
      });
      failed++;
      return;
    }

    const chunks = chunkText(content);
    if (chunks.length === 0) {
      await supabase
        .from("agent_knowledge_documents")
        .update({ status: "ready", chunk_count: 0 })
        .eq("id", doc.id);
      processed++;
      return;
    }

    const texts = chunks.map((c) => c.content);

    // Try to embed; if OpenAI key is missing, store chunks without embeddings
    let embeddings: number[][] | null = null;
    try {
      embeddings = await embedTexts(texts);
    } catch (embedErr) {
      const msg = embedErr instanceof Error ? embedErr.message : String(embedErr);
      logger.warn("Embedding skipped for knowledge document", {
        agentId,
        docId: doc.id,
        error: msg,
      });
    }

    const chunkRows = texts.map((text, i) => ({
      document_id: doc.id,
      agent_id: agentId,
      content: text,
      embedding: embeddings ? JSON.stringify(embeddings[i]) : null,
      chunk_index: i,
    }));

    const { error: chunkError } = await supabase
      .from("agent_knowledge_chunks")
      .insert(chunkRows);

    if (chunkError) {
      logger.error("Failed to insert knowledge chunks", {
        agentId,
        docId: doc.id,
        error: chunkError.message,
      });
      await supabase
        .from("agent_knowledge_documents")
        .update({ status: "error", error_message: chunkError.message })
        .eq("id", doc.id);
      failed++;
      return;
    }

    await supabase
      .from("agent_knowledge_documents")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", doc.id);
    processed++;
  }

  try {
    // 1. Process scraped pages
    for (const page of wizardConfig.scrapedPages ?? []) {
      if (!page.content) continue;
      await insertKnowledgeDoc(page.url, "website", page.content);
    }

    // 2. Process FAQs (each FAQ becomes a single-chunk document)
    for (const faq of wizardConfig.faqs ?? []) {
      const content = `Q: ${faq.question}\nA: ${faq.answer}`;
      await insertKnowledgeDoc(faq.question.slice(0, 100), "faq", content);
    }

    // 3. Process uploaded files
    for (const file of wizardConfig.files ?? []) {
      if (!file.extractedText) continue;
      await insertKnowledgeDoc(file.name, "file", file.extractedText);
    }

    logger.info("Knowledge processing complete", {
      agentId,
      processed,
      failed,
    });

    if (failed > 0) {
      enqueue({
        type: "progress",
        label: `Knowledge base: ${processed} processed, ${failed} failed`,
      });
    }
  } catch (err) {
    // Unexpected error — log but don't fail the agent creation
    logger.error("Knowledge processing failed", {
      agentId,
      processed,
      failed,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
