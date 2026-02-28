/**
 * Knowledge Base FAQ entry.
 * POST /api/agents/[agentId]/knowledge/faq
 *
 * Adds a question/answer pair, embeds, and stores.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedTexts } from "@/lib/knowledge/embeddings";

const MAX_DOCS_PER_AGENT = 10;

export async function POST(
  request: NextRequest,
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

  // Verify agent ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Check document count limit
  const { count } = await supabase
    .from("agent_knowledge_documents")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId);

  if (count !== null && count >= MAX_DOCS_PER_AGENT) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DOCS_PER_AGENT} documents per agent` },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { question?: string; answer?: string };
  const { question, answer } = body;

  if (!question || !answer || typeof question !== "string" || typeof answer !== "string") {
    return NextResponse.json(
      { error: "Both question and answer are required" },
      { status: 400 }
    );
  }

  const content = `Q: ${question.trim()}\nA: ${answer.trim()}`;

  // Create document record
  const { data: doc, error: insertError } = await supabase
    .from("agent_knowledge_documents")
    .insert({
      agent_id: agentId,
      user_id: user.id,
      source_type: "faq",
      source_name: question.trim().slice(0, 100),
      content,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }

  try {
    // FAQ is typically small — single chunk
    const tokenCount = Math.ceil(content.length / 4);
    const embeddings = await embedTexts([content]);

    const { error: chunkError } = await supabase
      .from("agent_knowledge_chunks")
      .insert({
        document_id: doc.id,
        agent_id: agentId,
        chunk_index: 0,
        content,
        embedding: JSON.stringify(embeddings[0]),
        token_count: tokenCount,
      });

    if (chunkError) {
      throw new Error(`Failed to store chunk: ${chunkError.message}`);
    }

    await supabase
      .from("agent_knowledge_documents")
      .update({ chunk_count: 1, status: "ready" })
      .eq("id", doc.id);

    return NextResponse.json({
      id: doc.id,
      source_type: "faq",
      source_name: question.trim().slice(0, 100),
      chunk_count: 1,
      status: "ready",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("agent_knowledge_documents")
      .update({ status: "error", error_message: message })
      .eq("id", doc.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
