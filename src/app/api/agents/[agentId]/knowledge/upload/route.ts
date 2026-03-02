/**
 * Knowledge Base file upload.
 * POST /api/agents/[agentId]/knowledge/upload
 *
 * Accepts multipart form data with a file (PDF, TXT, MD).
 * Extracts text, chunks, embeds, and stores in the knowledge base.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/knowledge/pdf-extract";
import { extractDocxText } from "@/lib/knowledge/docx-extract";
import { extractCsvText } from "@/lib/knowledge/csv-extract";
import { chunkText } from "@/lib/knowledge/chunking";
import { embedTexts } from "@/lib/knowledge/embeddings";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_DOCS_PER_AGENT = 20;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
]);

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

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "File type not supported. Use PDF, TXT, MD, DOCX, or CSV." },
      { status: 400 }
    );
  }

  // Create document record first (status: processing)
  const { data: doc, error: insertError } = await supabase
    .from("agent_knowledge_documents")
    .insert({
      agent_id: agentId,
      user_id: user.id,
      source_type: "file",
      source_name: file.name,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }

  try {
    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${user.id}/${agentId}/${doc.id}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("agent-knowledge")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Extract text
    let text: string;
    if (file.type === "application/pdf") {
      text = await extractPdfText(fileBuffer);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await extractDocxText(fileBuffer);
    } else if (file.type === "text/csv") {
      text = extractCsvText(fileBuffer);
    } else {
      text = fileBuffer.toString("utf-8");
    }

    if (!text.trim()) {
      throw new Error("No text content could be extracted from the file");
    }

    // Chunk text
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      throw new Error("No text chunks could be created");
    }

    // Embed all chunks
    const embeddings = await embedTexts(chunks.map((c) => c.content));

    // Insert chunks with embeddings
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
        content: text,
        file_path: storagePath,
        chunk_count: chunks.length,
        status: "ready",
      })
      .eq("id", doc.id);

    return NextResponse.json({
      id: doc.id,
      source_type: "file",
      source_name: file.name,
      content: text,
      chunk_count: chunks.length,
      status: "ready",
      error_message: null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Update document to error status
    await supabase
      .from("agent_knowledge_documents")
      .update({ status: "error", error_message: message })
      .eq("id", doc.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
