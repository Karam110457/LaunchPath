/**
 * Contextual Retrieval — prepend AI-generated context to each chunk before embedding.
 *
 * Based on Anthropic's research showing 35% better retrieval when chunks include
 * a brief description of where they fit within the source document. Combined with
 * hybrid search, this yields ~67% fewer retrieval failures.
 *
 * Uses prompt caching: the full document is sent once and cached, then each chunk
 * context generation reuses the cached prefix — reducing cost by ~90%.
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { logger } from "@/lib/security/logger";

const CONTEXT_MODEL = "claude-haiku-4-5-20251001";

/** Max concurrent chunk context calls per document */
const CHUNK_CONCURRENCY = 5;

/**
 * Generate a short contextual prefix for a single chunk.
 * Returns a 1-2 sentence description situating the chunk within the document.
 */
async function generateChunkContext(
  documentTitle: string,
  fullDocumentText: string,
  chunkContent: string
): Promise<string> {
  const result = await generateText({
    model: anthropic(CONTEXT_MODEL),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `<document title="${documentTitle}">\n${fullDocumentText}\n</document>`,
            providerOptions: {
              anthropic: { cacheControl: { type: "ephemeral" } },
            },
          },
          {
            type: "text",
            text:
              `Given the above document, write a short (1-2 sentence) context that explains ` +
              `where the following chunk fits within the document and what it's about. ` +
              `Be specific and concise. Do NOT repeat the chunk content.\n\n` +
              `<chunk>\n${chunkContent}\n</chunk>`,
          },
        ],
      },
    ],
    maxOutputTokens: 150,
  });

  return result.text.trim();
}

/**
 * Add contextual prefixes to an array of chunks from the same document.
 *
 * Each chunk's content is prepended with a brief AI-generated context line:
 *   "[Context: This section covers pricing details from the Services page.]"
 *   + original chunk content
 *
 * If context generation fails for a chunk, the original content is preserved unchanged.
 *
 * Chunks are processed in parallel batches of CHUNK_CONCURRENCY for speed,
 * while keeping prompt-cache hits effective (all share the same document prefix).
 *
 * @param documentTitle - Human-readable source name (URL, filename, etc.)
 * @param fullDocumentText - The complete document text (used for context, cached)
 * @param chunks - Array of chunk content strings to contextualize
 * @returns Array of contextualized chunk strings (same order and length as input)
 */
export async function addContextToChunks(
  documentTitle: string,
  fullDocumentText: string,
  chunks: string[]
): Promise<string[]> {
  if (chunks.length === 0) return [];

  // Skip contextual retrieval for very short documents (< 500 chars)
  // where the full content is likely a single chunk anyway
  if (fullDocumentText.length < 500) return chunks;

  // Truncate document to ~25k chars to stay within reasonable prompt size
  // while preserving enough context for situating chunks
  const truncatedDoc =
    fullDocumentText.length > 25000
      ? fullDocumentText.slice(0, 25000) + "\n\n[Document truncated...]"
      : fullDocumentText;

  const results: string[] = [...chunks]; // start with originals as fallback

  async function processChunk(index: number) {
    try {
      const context = await generateChunkContext(
        documentTitle,
        truncatedDoc,
        chunks[index]
      );
      if (context) {
        results[index] = `[Context: ${context}]\n\n${chunks[index]}`;
      }
    } catch (err) {
      // Non-critical — keep original chunk without context
      logger.warn("Contextual retrieval failed for chunk", {
        documentTitle,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Process chunks in parallel batches
  for (let i = 0; i < chunks.length; i += CHUNK_CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(CHUNK_CONCURRENCY, chunks.length - i) },
      (_, j) => processChunk(i + j)
    );
    await Promise.allSettled(batch);
  }

  return results;
}
