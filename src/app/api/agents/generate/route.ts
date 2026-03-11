import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { logger } from "@/lib/security/logger";
import { agentGenerationOutputSchema } from "@/lib/ai/schemas";
import { buildAgentGenerationContext } from "@/lib/ai/agent-builder-prompt";
import { getTemplateById } from "@/lib/agents/templates";
import { withRateLimitRetry } from "@/lib/ai/rate-limit-retry";
import { getComposioClient } from "@/lib/composio/client";
import { generateConfigDirectives, updatePromptDirectives } from "@/lib/agents/config-directives";
import { extractWebsiteFacts } from "@/lib/ai/extract-website-facts";
import { chunkText } from "@/lib/knowledge/chunking";
import { embedTexts } from "@/lib/knowledge/embeddings";
import { addContextToChunks } from "@/lib/knowledge/contextual-retrieval";
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
      selectedToolkits?: string[];
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
          suggested_personality: template.suggested_personality,
        }
      : null;

  const encoder = new TextEncoder();

  const sseStream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        // ── Extract website facts via Haiku before building context ──
        let websiteSummary: string | undefined;
        if (wizardConfig?.scrapedPages?.length) {
          enqueue({ type: "progress", label: "Analyzing your website content..." });
          const facts = await extractWebsiteFacts(wizardConfig.scrapedPages);
          if (facts.summary) {
            websiteSummary = facts.summary;
          }
        }

        enqueue({ type: "progress", label: "Understanding your requirements..." });

        const context = buildAgentGenerationContext({
          userPrompt: prompt ?? "",
          templateContext,
          businessContext,
          wizardConfig: wizardConfig
            ? { ...wizardConfig, websiteSummary }
            : null,
        });

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

        if (!agentConfig.system_prompt || !agentConfig.system_prompt.trim()) {
          enqueue({ type: "error", error: "AI failed to generate a system prompt. Please try again." });
          return;
        }

        enqueue({ type: "progress", label: "Saving your agent..." });

        // Build final system prompt: AI-generated base + config directives
        let finalSystemPrompt = agentConfig.system_prompt;

        // Generate config directives from wizard settings and bake them into the prompt
        const configDirectives = generateConfigDirectives({
          personality: agentConfig.personality,
          wizardConfig: wizardConfig ? {
            templateId: wizardConfig.templateId,
            qualifyingQuestions: wizardConfig.qualifyingQuestions,
            behaviorConfig: wizardConfig.behaviorConfig,
          } : null,
          toolGuidelines: template?.toolWorkflow,
        });
        if (configDirectives) {
          finalSystemPrompt = updatePromptDirectives(finalSystemPrompt, configDirectives);
        }

        const { data: newAgent, error: insertError } = await supabase
          .from("ai_agents")
          .insert({
            user_id: user.id,
            system_id: systemId ?? null,
            name: agentConfig.name,
            description: agentConfig.description,
            system_prompt: finalSystemPrompt,
            personality: agentConfig.personality,
            enabled_tools: [],
            template_id: templateId ?? null,
            model: "claude-sonnet-4-5-20250929",
            status: "draft",
            tool_guidelines: template?.toolWorkflow ?? null,
            wizard_config: wizardConfig
              ? {
                  templateId: wizardConfig.templateId,
                  businessDescription: wizardConfig.businessDescription,
                  qualifyingQuestions: wizardConfig.qualifyingQuestions,
                  behaviorConfig: wizardConfig.behaviorConfig,
                  personality: wizardConfig.personality,
                }
              : null,
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
              const kbResult = await processWizardKnowledge(
                supabase,
                newAgent.id,
                user.id,
                wizardConfig,
                enqueue,
              );

              if (kbResult.processed > 0) {
                // Append KB usage note to the system prompt + enable KB flag
                const kbNote =
                  "\n\n## Knowledge Base\n" +
                  "You have a knowledge base with uploaded documents and website content. " +
                  "Relevant information is automatically provided with each message. " +
                  "If you need to search for specific information, use the search_knowledge_base tool.";
                await supabase
                  .from("ai_agents")
                  .update({
                    knowledge_enabled: true,
                    system_prompt: finalSystemPrompt + kbNote,
                  })
                  .eq("id", newAgent.id);
              }
            }
          }

          // Auto-add suggested Composio tools from template (filtered by user selection)
          if (template?.suggestedTools?.length) {
            const selectedToolkits = wizardConfig?.selectedToolkits;
            const toolsToAdd = selectedToolkits
              ? template.suggestedTools.filter((t) =>
                  selectedToolkits.includes(t.toolkit),
                )
              : template.suggestedTools;

            if (toolsToAdd.length > 0) {
              try {
                // Fetch toolkit logos from Composio so canvas shows real icons
                const toolkitLogos = await fetchToolkitLogos(
                  toolsToAdd.map((t) => t.toolkit),
                );

                for (const tool of toolsToAdd) {
                  await supabase.from("agent_tools").insert({
                    agent_id: newAgent.id,
                    user_id: user.id,
                    tool_type: "composio",
                    display_name: tool.displayName,
                    description: tool.description,
                    config: {
                      toolkit: tool.toolkit,
                      toolkit_name: tool.toolkitName,
                      toolkit_icon: toolkitLogos[tool.toolkit] ?? undefined,
                      enabled_actions: tool.actions,
                    },
                    is_enabled: true,
                  });
                }
                logger.info("Auto-added template tools", {
                  agentId: newAgent.id,
                  toolCount: toolsToAdd.length,
                });
              } catch (toolErr) {
                // Tool auto-config failed — agent still exists, user can add manually
                logger.warn("Failed to auto-add template tools", {
                  agentId: newAgent.id,
                  error: toolErr instanceof Error ? toolErr.message : String(toolErr),
                });
              }
            }
          }

          // Create initial version snapshot (v1)
          try {
            const { data: knowledgeDocs } = await supabase
              .from("agent_knowledge_documents")
              .select("id, source_type, source_name, status")
              .eq("agent_id", newAgent.id);

            await supabase.from("agent_versions").insert({
              agent_id: newAgent.id,
              user_id: user.id,
              version_number: 1,
              name: agentConfig.name,
              description: agentConfig.description,
              system_prompt: agentConfig.system_prompt,
              personality: agentConfig.personality ?? {},
              model: "claude-sonnet-4-5-20250929",
              status: "draft",
              change_title: "Initial version",
              change_description: null,
              knowledge_snapshot: knowledgeDocs ?? [],
            });
          } catch {
            // Versioning table may not exist yet — don't block creation
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

// ---------------------------------------------------------------------------
// Fetch toolkit logos from Composio
// ---------------------------------------------------------------------------

async function fetchToolkitLogos(
  toolkitSlugs: string[],
): Promise<Record<string, string>> {
  try {
    const composio = getComposioClient();
    const allToolkits = (await composio.toolkits.get({
      sortBy: "usage",
      limit: 200,
    })) as unknown as Array<{
      slug: string;
      meta?: { logo?: string };
    }>;

    const logos: Record<string, string> = {};
    const slugSet = new Set(toolkitSlugs);

    for (const tk of allToolkits) {
      if (slugSet.has(tk.slug) && tk.meta?.logo) {
        logos[tk.slug] = tk.meta.logo;
      }
    }

    return logos;
  } catch {
    // Non-critical — tools will show fallback icons
    return {};
  }
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
): Promise<{ processed: number; failed: number }> {
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

    let texts = chunks.map((c) => c.content);

    // Contextual retrieval: prepend AI-generated context to each chunk
    // so embeddings capture where the chunk fits within the document.
    try {
      texts = await addContextToChunks(sourceName, content, texts);
    } catch (ctxErr) {
      logger.warn("Contextual retrieval skipped", {
        agentId,
        docId: doc.id,
        error: ctxErr instanceof Error ? ctxErr.message : String(ctxErr),
      });
    }

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
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Knowledge processing failed", {
      agentId,
      processed,
      failed,
      error: msg,
    });
    enqueue({
      type: "progress",
      label: `Knowledge base processing failed: ${msg}`,
    });
  }

  return { processed, failed };
}
