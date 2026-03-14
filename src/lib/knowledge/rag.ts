/**
 * RAG retrieval — embed query, search similar chunks, build context string.
 */

import { embedText } from "./embeddings";
import type { SupabaseClient } from "@supabase/supabase-js";

const SIMILARITY_THRESHOLD = 0.3;

/**
 * Minimum RRF score for hybrid search results.
 * With rrf_k=50 and match_count=8 (candidate pool = 16 per ranking):
 * - Rank 1 in one ranking only: 1/51 = 0.0196
 * - Rank 16 in one ranking only: 1/66 = 0.0152 (minimum possible)
 * 0.01 is a safety net — rarely filters with current SQL, but catches
 * edge cases if ranking behavior changes.
 */
const RRF_MIN_SCORE = 0.01;

/**
 * Max total characters to inject as RAG context into the system prompt.
 * ~4,000 chars ≈ ~1,000 tokens. If retrieved chunks exceed this budget,
 * the lowest-scored ones are dropped until the budget is met.
 */
const MAX_RAG_CHARS = 4000;

/**
 * Match count for small knowledge bases (< 30 chunks).
 * Pulling 8 candidates from a 24-chunk KB means 1/3 of all content —
 * overkill. 4 candidates is enough for small KBs.
 */
const SMALL_KB_MATCH_COUNT = 4;

/** Default match count for larger KBs. */
const DEFAULT_MATCH_COUNT = 8;

/**
 * Below this chunk count, inject ALL chunks — no similarity search needed.
 * Keep this low: a 926-char avg chunk × 200 = ~46,000 tokens injected every
 * message. Set to 10 so only truly tiny KBs skip embedding retrieval.
 */
export const SMALL_KB_THRESHOLD = 10;

/**
 * Max chunks to fall back to loading when embedding API fails.
 * At ~926 chars avg, 50 chunks ≈ ~11,500 tokens — acceptable for degraded mode.
 * KBs over this limit still have the search_knowledge_base tool as a safety net.
 */
export const EMBEDDING_FALLBACK_LIMIT = 50;

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
 *
 * Applies a token budget cap (MAX_RAG_CHARS) — drops lowest-scored chunks
 * until the total injected context fits within budget.
 *
 * @param totalChunks - total chunks in the KB, used to pick match_count dynamically.
 */
export async function retrieveContextWithMetadata(
  agentId: string,
  query: string,
  supabase: SupabaseClient,
  totalChunks?: number
): Promise<RagResult> {
  try {
    const queryEmbedding = await embedText(query);

    // Dynamic match_count: small KBs don't need 8 candidates
    const matchCount =
      totalChunks != null && totalChunks < 30
        ? SMALL_KB_MATCH_COUNT
        : DEFAULT_MATCH_COUNT;

    // Hybrid search: combines vector similarity + BM25 keyword search via RRF
    const { data: chunks, error } = await supabase.rpc(
      "hybrid_match_knowledge_chunks",
      {
        query_text: query,
        query_embedding: JSON.stringify(queryEmbedding),
        match_agent_id: agentId,
        match_count: matchCount,
      }
    );

    if (error || !chunks || chunks.length === 0) {
      return { contextString: "", chunks: [] };
    }

    // RRF scoring already ranks by combined relevance — filter low-scoring results
    const relevant = (
      chunks as Array<{
        id: string;
        content: string;
        similarity: number;
        document_id: string;
        source_name: string;
        source_type: string;
      }>
    ).filter((c) => c.similarity >= RRF_MIN_SCORE);

    if (relevant.length === 0) {
      return { contextString: "", chunks: [] };
    }

    // Apply token budget: keep highest-scored chunks until we hit the cap.
    // `relevant` is already sorted by RRF score descending.
    let totalChars = 0;
    const budgeted: typeof relevant = [];
    for (const c of relevant) {
      if (totalChars + c.content.length > MAX_RAG_CHARS && budgeted.length > 0) {
        break; // Always include at least one chunk
      }
      budgeted.push(c);
      totalChars += c.content.length;
    }

    const ragChunks: RagChunk[] = budgeted.map((c) => ({
      content: c.content,
      similarity: c.similarity,
      sourceName: c.source_name,
      sourceType: c.source_type,
      documentId: c.document_id,
    }));

    const contextParts = budgeted.map((c) => c.content);
    const contextString =
      "Use the following knowledge to answer questions. " +
      "If the answer is not in the knowledge base, say so honestly.\n\n" +
      "---\n" +
      contextParts.join("\n---\n") +
      "\n---";

    return { contextString, chunks: ragChunks };
  } catch (err) {
    // Re-throw so the caller can implement fallback strategy (e.g. loadAllChunks)
    console.error("RAG retrieval failed:", err);
    throw err;
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
