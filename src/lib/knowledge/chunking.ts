/**
 * Text chunking for knowledge base documents.
 * Splits text into ~500-token chunks with ~100-token overlap.
 */

export interface TextChunk {
  content: string;
  tokenCount: number;
}

/** Rough token estimate: ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const TARGET_CHUNK_CHARS = 2000; // ~500 tokens
const OVERLAP_CHARS = 400; // ~100 tokens

/**
 * Split text into chunks at paragraph boundaries.
 * Each chunk targets ~500 tokens with ~100 token overlap.
 */
export function chunkText(
  text: string,
  options?: { targetChars?: number; overlapChars?: number }
): TextChunk[] {
  const targetChars = options?.targetChars ?? TARGET_CHUNK_CHARS;
  const overlapChars = options?.overlapChars ?? OVERLAP_CHARS;

  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  // If entire text fits in one chunk, return it
  if (cleaned.length <= targetChars) {
    return [{ content: cleaned, tokenCount: estimateTokens(cleaned) }];
  }

  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If adding this paragraph would exceed target, finalize current chunk
    if (currentChunk && currentChunk.length + trimmed.length + 2 > targetChars) {
      chunks.push({
        content: currentChunk.trim(),
        tokenCount: estimateTokens(currentChunk),
      });

      // Start new chunk with overlap from the end of previous
      const overlapStart = Math.max(0, currentChunk.length - overlapChars);
      currentChunk = currentChunk.slice(overlapStart).trim() + "\n\n" + trimmed;
    } else {
      currentChunk = currentChunk
        ? currentChunk + "\n\n" + trimmed
        : trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}
