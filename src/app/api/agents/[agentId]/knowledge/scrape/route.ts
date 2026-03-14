/**
 * Knowledge Base website scraping.
 * POST /api/agents/[agentId]/knowledge/scrape
 *
 * Scrapes a URL, extracts text, chunks, embeds, and stores.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeWebsite } from "@/lib/knowledge/web-scraper";
import { chunkText } from "@/lib/knowledge/chunking";
import { embedTexts } from "@/lib/knowledge/embeddings";

const MAX_DOCS_PER_AGENT = 20;

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

  const body = (await request.json()) as { url?: string };
  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Create document record (status: processing)
  const { data: doc, error: insertError } = await supabase
    .from("agent_knowledge_documents")
    .insert({
      agent_id: agentId,
      user_id: user.id,
      source_type: "website",
      source_name: url,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }

  try {
    // Scrape the website
    const { content } = await scrapeWebsite(url);

    if (!content.trim()) {
      throw new Error("No text content could be extracted from the URL");
    }

    // Chunk text — website content uses smaller chunks (1,600 chars ≈ 400 tokens)
    // to prevent large website chunks from dominating the RAG token budget.
    // FAQ/doc chunks (via upload route) keep the default 3,200 char target.
    const chunks = chunkText(content, { targetChars: 1600, overlapChars: 320 });
    if (chunks.length === 0) {
      throw new Error("No text chunks could be created");
    }

    // Embed all chunks
    const embeddings = await embedTexts(chunks.map((c) => c.content));

    // Insert chunks
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: doc.id,
      agent_id: agentId,
      chunk_index: i,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[i]),
      token_count: chunk.tokenCount,
    }));

    const { error: chunkError } = await supabase
      .from("agent_knowledge_chunks")
      .insert(chunkRows);

    if (chunkError) {
      throw new Error(`Failed to store chunks: ${chunkError.message}`);
    }

    // Update document to ready
    await supabase
      .from("agent_knowledge_documents")
      .update({
        content,
        chunk_count: chunks.length,
        status: "ready",
      })
      .eq("id", doc.id);

    return NextResponse.json({
      id: doc.id,
      source_type: "website",
      source_name: url,
      content,
      chunk_count: chunks.length,
      status: "ready",
      error_message: null,
      created_at: new Date().toISOString(),
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
