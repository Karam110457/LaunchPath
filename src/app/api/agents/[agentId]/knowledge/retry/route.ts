/**
 * Retry failed knowledge import.
 * POST /api/agents/[agentId]/knowledge/retry
 *
 * Re-processes a document that is in error state.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/knowledge/pdf-extract";
import { extractDocxText } from "@/lib/knowledge/docx-extract";
import { extractCsvText } from "@/lib/knowledge/csv-extract";
import { scrapeWebsite } from "@/lib/knowledge/web-scraper";
import { chunkText } from "@/lib/knowledge/chunking";
import { embedTexts } from "@/lib/knowledge/embeddings";

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

  const body = (await request.json()) as { documentId?: string };
  const { documentId } = body;

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 }
    );
  }

  // Fetch the failed document
  const { data: doc } = await supabase
    .from("agent_knowledge_documents")
    .select("*")
    .eq("id", documentId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .eq("status", "error")
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found or not in error state" },
      { status: 404 }
    );
  }

  // Reset to processing
  await supabase
    .from("agent_knowledge_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", documentId);

  // Delete any partial chunks from previous attempt
  await supabase
    .from("agent_knowledge_chunks")
    .delete()
    .eq("document_id", documentId);

  try {
    let content = doc.content as string | null;

    // For files, re-extract from storage if content is empty
    if (doc.source_type === "file" && doc.file_path && !content?.trim()) {
      const { data: fileData } = await supabase.storage
        .from("agent-knowledge")
        .download(doc.file_path);

      if (!fileData) throw new Error("Could not download file from storage");

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const name = (doc.source_name as string).toLowerCase();
      if (name.endsWith(".pdf")) {
        content = await extractPdfText(buffer);
      } else if (name.endsWith(".docx")) {
        content = await extractDocxText(buffer);
      } else if (name.endsWith(".csv")) {
        content = extractCsvText(buffer);
      } else {
        content = buffer.toString("utf-8");
      }
    }

    // For websites, re-scrape
    if (doc.source_type === "website" && !content?.trim()) {
      const scraped = await scrapeWebsite(doc.source_name);
      content = scraped.content;
    }

    if (!content?.trim()) {
      throw new Error("No content could be extracted");
    }

    // Chunk and embed — website content uses smaller chunks to keep RAG lean
    const chunkOpts = doc.source_type === "website"
      ? { targetChars: 1600, overlapChars: 320 }
      : undefined;
    const chunks = chunkText(content, chunkOpts);
    if (chunks.length === 0) {
      throw new Error("No text chunks could be created");
    }

    const embeddings = await embedTexts(chunks.map((c) => c.content));

    const chunkRows = chunks.map((chunk, i) => ({
      document_id: documentId,
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
        error_message: null,
      })
      .eq("id", documentId);

    return NextResponse.json({
      id: documentId,
      status: "ready",
      chunk_count: chunks.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("agent_knowledge_documents")
      .update({ status: "error", error_message: message })
      .eq("id", documentId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
