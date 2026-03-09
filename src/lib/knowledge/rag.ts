/**
 * RAG retrieval — embed query, search similar chunks, build context string.
 */

import { embedText } from "./embeddings";
import type { SupabaseClient } from "@supabase/supabase-js";

const SIMILARITY_THRESHOLD = 0.3;

/** Below this chunk count, inject ALL chunks — no similarity search needed. */
export const SMALL_KB_THRESHOLD = 15;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RagChunk {
  content: string;
  similarity: number;
  sourceName: string;
  sourceType: string;
  documentId: string;
}

export interface RagResult {
  contextString: string;
  chunks: RagChunk[];
}

/**
 * Retrieve relevant knowledge base context for a user query.
 * Returns a formatted context string to inject into the system prompt,
 * or empty string if no relevant chunks found.
 */
export async function retrieveContext(
  agentId: string,
  query: string,
  supabase: SupabaseClient
): Promise<string> {
  try {
    // Embed the user's query
    const queryEmbedding = await embedText(query);

    // Search for similar chunks via the pgvector function
    const { data: chunks, error } = await supabase.rpc(
      "match_knowledge_chunks",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_agent_id: agentId,
        match_count: 5,
      }
    );

    if (error || !chunks || chunks.length === 0) {
      return "";
    }

    // Filter by similarity threshold
    const relevant = (chunks as Array<{ id: string; content: string; similarity: number }>)
      .filter((c) => c.similarity >= SIMILARITY_THRESHOLD);

    if (relevant.length === 0) {
      return "";
    }

    // Build context string
    const contextParts = relevant.map((c) => c.content);
    return (
      "Use the following knowledge to answer questions. " +
      "If the answer is not in the knowledge base, say so honestly.\n\n" +
      "---\n" +
      contextParts.join("\n---\n") +
      "\n---"
    );
  } catch (err) {
    // Don't let RAG failures break the chat — log and continue without context
    console.error("RAG retrieval failed:", err);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Enhanced retrieval with document metadata (for transparency UI)
// ---------------------------------------------------------------------------

/**
 * Retrieve knowledge context with full metadata.
 * Returns structured chunk data alongside the context string so the UI
 * can display which documents were referenced.
 */
export async function retrieveContextWithMetadata(
  agentId: string,
  query: string,
  supabase: SupabaseClient
): Promise<RagResult> {
  try {
    const queryEmbedding = await embedText(query);

    const { data: chunks, error } = await supabase.rpc(
      "match_knowledge_chunks_v2",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_agent_id: agentId,
        match_count: 5,
      }
    );

    if (error || !chunks || chunks.length === 0) {
      return { contextString: "", chunks: [] };
    }

    const relevant = (
      chunks as Array<{
        id: string;
        content: string;
        similarity: number;
        document_id: string;
        source_name: string;
        source_type: string;
      }>
    ).filter((c) => c.similarity >= SIMILARITY_THRESHOLD);

    if (relevant.length === 0) {
      return { contextString: "", chunks: [] };
    }

    const ragChunks: RagChunk[] = relevant.map((c) => ({
      content: c.content,
      similarity: c.similarity,
      sourceName: c.source_name,
      sourceType: c.source_type,
      documentId: c.document_id,
    }));

    const contextParts = relevant.map((c) => c.content);
    const contextString =
      "Use the following knowledge to answer questions. " +
      "If the answer is not in the knowledge base, say so honestly.\n\n" +
      "---\n" +
      contextParts.join("\n---\n") +
      "\n---";

    return { contextString, chunks: ragChunks };
  } catch (err) {
    console.error("RAG retrieval failed:", err);
    return { contextString: "", chunks: [] };
  }
}

// ---------------------------------------------------------------------------
// Small knowledge base: load ALL chunks (no embedding, no similarity search)
// ---------------------------------------------------------------------------

/**
 * Load every chunk for an agent directly from the DB.
 * Used when the total chunk count is small enough to inject everything
 * into the system prompt — faster and more reliable than similarity search.
 *
 * No embedding call, no similarity threshold. Every chunk is included.
 */
export async function loadAllChunks(
  agentId: string,
  supabase: SupabaseClient
): Promise<RagResult> {
  try {
    const { data: rows, error } = await supabase
      .from("agent_knowledge_chunks")
      .select(
        "id, content, document_id, agent_knowledge_documents!inner(source_name, source_type, status)"
      )
      .eq("agent_id", agentId)
      .eq("agent_knowledge_documents.status", "ready")
      .order("document_id")
      .order("chunk_index");

    if (error || !rows || rows.length === 0) {
      return { contextString: "", chunks: [] };
    }

    const ragChunks: RagChunk[] = rows.map((r) => {
      const doc = r.agent_knowledge_documents as unknown as {
        source_name: string;
        source_type: string;
      };
      return {
        content: r.content as string,
        similarity: 1, // all content is included — treat as perfect match
        sourceName: doc.source_name,
        sourceType: doc.source_type,
        documentId: r.document_id as string,
      };
    });

    const contextParts = ragChunks.map((c) => c.content);
    const contextString =
      "The following is your complete knowledge base. Use this information to answer questions. " +
      "If the answer is not in the knowledge base, say so honestly.\n\n" +
      "---\n" +
      contextParts.join("\n---\n") +
      "\n---";

    return { contextString, chunks: ragChunks };
  } catch (err) {
    console.error("loadAllChunks failed:", err);
    return { contextString: "", chunks: [] };
  }
}
