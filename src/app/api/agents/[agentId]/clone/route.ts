/**
 * Clone Agent API route.
 * POST /api/agents/[agentId]/clone
 *
 * Creates a full copy of the agent including:
 * - Core config (name, prompt, personality, model, etc.)
 * - Tool configurations (agent_tools rows with raw configs)
 * - Knowledge base documents and chunks (with embeddings)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch source agent
  const { data: source } = await supabase
    .from("ai_agents")
    .select(
      "name, description, system_prompt, personality, enabled_tools, model, template_id, wizard_config, tool_guidelines, knowledge_enabled"
    )
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!source) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Insert cloned agent
  const { data: clone, error } = await supabase
    .from("ai_agents")
    .insert({
      user_id: user.id,
      name: `Copy of ${source.name}`,
      description: source.description,
      system_prompt: source.system_prompt,
      personality: source.personality,
      enabled_tools: source.enabled_tools,
      model: source.model,
      template_id: source.template_id,
      wizard_config: source.wizard_config,
      tool_guidelines: source.tool_guidelines,
      knowledge_enabled: source.knowledge_enabled,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !clone) {
    return NextResponse.json({ error: "Clone failed" }, { status: 500 });
  }

  // Clone tools and knowledge — if this fails, agent still exists with core config
  try {
    // ── Clone tools ─────────────────────────────────────────────────────────
    const { data: sourceTools } = await supabase
      .from("agent_tools")
      .select("tool_type, display_name, description, config, is_enabled")
      .eq("agent_id", agentId);

    if (sourceTools?.length) {
      await supabase.from("agent_tools").insert(
        sourceTools.map((t) => ({
          agent_id: clone.id,
          user_id: user.id,
          tool_type: t.tool_type,
          display_name: t.display_name,
          description: t.description,
          config: t.config,
          is_enabled: t.is_enabled,
        }))
      );
    }

    // ── Clone knowledge documents ───────────────────────────────────────────
    const { data: sourceDocs } = await supabase
      .from("agent_knowledge_documents")
      .select("id, source_type, source_name, content, chunk_count, status")
      .eq("agent_id", agentId)
      .eq("status", "ready");

    const docIdMap = new Map<string, string>();

    if (sourceDocs?.length) {
      const { data: clonedDocs } = await supabase
        .from("agent_knowledge_documents")
        .insert(
          sourceDocs.map((d) => ({
            agent_id: clone.id,
            user_id: user.id,
            source_type: d.source_type,
            source_name: d.source_name,
            file_path: null,
            content: d.content,
            chunk_count: d.chunk_count,
            status: "ready",
          }))
        )
        .select("id");

      if (clonedDocs) {
        sourceDocs.forEach((src, i) => {
          docIdMap.set(src.id, clonedDocs[i].id);
        });
      }
    }

    // ── Clone knowledge chunks with embeddings ──────────────────────────────
    if (docIdMap.size > 0) {
      const { data: sourceChunks } = await supabase
        .from("agent_knowledge_chunks")
        .select("document_id, chunk_index, content, embedding, token_count")
        .eq("agent_id", agentId);

      if (sourceChunks?.length) {
        await supabase.from("agent_knowledge_chunks").insert(
          sourceChunks
            .filter((c) => docIdMap.has(c.document_id))
            .map((c) => ({
              document_id: docIdMap.get(c.document_id)!,
              agent_id: clone.id,
              chunk_index: c.chunk_index,
              content: c.content,
              embedding: c.embedding,
              token_count: c.token_count,
            }))
        );
      }
    }
  } catch {
    // Tools/knowledge cloning failed — agent still exists with core config
  }

  return NextResponse.json({ id: clone.id });
}
