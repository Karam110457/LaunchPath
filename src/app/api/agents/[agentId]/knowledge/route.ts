/**
 * Knowledge Base list and delete.
 * GET  /api/agents/[agentId]/knowledge — list all documents
 * DELETE /api/agents/[agentId]/knowledge?documentId=xxx — delete a document
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const { data: documents, error } = await supabase
    .from("agent_knowledge_documents")
    .select("id, source_type, source_name, content, chunk_count, status, error_message, created_at")
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }

  return NextResponse.json({ documents: documents ?? [] });
}

export async function DELETE(
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

  const deleteAll = request.nextUrl.searchParams.get("all") === "true";
  const documentId = request.nextUrl.searchParams.get("documentId");

  if (deleteAll) {
    // Bulk delete: remove all documents for this agent
    const { data: docs } = await supabase
      .from("agent_knowledge_documents")
      .select("id, file_path")
      .eq("agent_id", agentId)
      .eq("user_id", user.id);

    if (docs && docs.length > 0) {
      // Clean up storage files
      const paths = docs.map((d) => d.file_path).filter(Boolean) as string[];
      if (paths.length > 0) {
        await supabase.storage.from("agent-knowledge").remove(paths);
      }
      // Delete all documents (chunks cascade automatically)
      await supabase
        .from("agent_knowledge_documents")
        .delete()
        .eq("agent_id", agentId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ ok: true });
  }

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  // Fetch document to get file_path for storage cleanup
  const { data: doc } = await supabase
    .from("agent_knowledge_documents")
    .select("id, file_path")
    .eq("id", documentId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Delete storage file if it exists
  if (doc.file_path) {
    await supabase.storage.from("agent-knowledge").remove([doc.file_path]);
  }

  // Delete document (chunks cascade automatically)
  await supabase
    .from("agent_knowledge_documents")
    .delete()
    .eq("id", documentId);

  return NextResponse.json({ ok: true });
}
