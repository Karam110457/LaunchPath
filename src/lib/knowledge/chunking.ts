/**
 * Text chunking for knowledge base documents.
 *
 * Markdown-aware: prefers splitting at heading boundaries (`#`, `##`, etc.)
 * and prepends heading breadcrumbs to continuation chunks so every chunk
 * has section context for better embedding and retrieval quality.
 *
 * Falls back to paragraph-only splitting for non-markdown content
 * (PDF text, DOCX text, CSV, plain TXT).
 */

export interface TextChunk {
  content: string;
  tokenCount: number;
}

/** Rough token estimate: ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const TARGET_CHUNK_CHARS = 3200; // ~800 tokens
const OVERLAP_CHARS = 640; // ~160 tokens

// ---------------------------------------------------------------------------
// Markdown section types
// ---------------------------------------------------------------------------

interface MarkdownSection {
  /** The heading line (e.g. "## Pricing") — empty string for pre-heading content. */
  heading: string;
  /** Hierarchical context (e.g. "Services > Pricing") — empty for pre-heading. */
  breadcrumb: string;
  /** Heading depth: 0 for pre-heading content, 1-6 for headings. */
  level: number;
  /** Content body after the heading until the next heading. */
  body: string;
}

// ---------------------------------------------------------------------------
// Markdown heading detection
// ---------------------------------------------------------------------------

/** Heading regex: line starting with 1-6 `#` followed by a space. */
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/**
 * Check if text contains markdown headings outside of fenced code blocks.
 * Used to decide between markdown-aware and plain paragraph splitting.
 */
function hasMarkdownHeadings(text: string): boolean {
  const lines = text.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock && HEADING_RE.test(line)) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Parse text into sections by heading boundaries
// ---------------------------------------------------------------------------

function parseMarkdownSections(text: string): MarkdownSection[] {
  const lines = text.split("\n");
  const sections: MarkdownSection[] = [];

  // Breadcrumb stack: [ { text, level } ]
  const stack: Array<{ text: string; level: number }> = [];

  let currentHeading = "";
  let currentBreadcrumb = "";
  let currentLevel = 0;
  let bodyLines: string[] = [];
  let inCodeBlock = false;

  function flushSection() {
    const body = bodyLines.join("\n").trim();
    if (currentHeading || body) {
      sections.push({
        heading: currentHeading,
        breadcrumb: currentBreadcrumb,
        level: currentLevel,
        body,
      });
    }
  }

  for (const line of lines) {
    // Track fenced code blocks
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      bodyLines.push(line);
      continue;
    }

    // Inside code block — everything is body content
    if (inCodeBlock) {
      bodyLines.push(line);
      continue;
    }

    const match = line.match(HEADING_RE);
    if (match) {
      // Flush previous section
      flushSection();

      const level = match[1].length;
      const headingText = match[2].trim();

      // Update breadcrumb stack: pop entries at same or deeper level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack.push({ text: headingText, level });

      currentHeading = line;
      currentBreadcrumb = stack.map((s) => s.text).join(" > ");
      currentLevel = level;
      bodyLines = [];
    } else {
      bodyLines.push(line);
    }
  }

  // Flush final section
  flushSection();

  return sections;
}

// ---------------------------------------------------------------------------
// Paragraph-only splitting (fallback for non-markdown content)
// ---------------------------------------------------------------------------

function chunkByParagraphs(
  text: string,
  targetChars: number,
  overlapChars: number
): TextChunk[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (currentChunk && currentChunk.length + trimmed.length + 2 > targetChars) {
      chunks.push({
        content: currentChunk.trim(),
        tokenCount: estimateTokens(currentChunk),
      });

      const overlapStart = Math.max(0, currentChunk.length - overlapChars);
      currentChunk = currentChunk.slice(overlapStart).trim() + "\n\n" + trimmed;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmed : trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Split a large section at paragraph boundaries with breadcrumb context
// ---------------------------------------------------------------------------

function chunkLargeSection(
  section: MarkdownSection,
  targetChars: number,
  overlapChars: number
): TextChunk[] {
  // Build full section text: heading + body
  const fullText = section.heading
    ? section.heading + "\n\n" + section.body
    : section.body;

  const paragraphs = fullText.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let isFirstChunk = true;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (currentChunk && currentChunk.length + trimmed.length + 2 > targetChars) {
      chunks.push({
        content: currentChunk.trim(),
        tokenCount: estimateTokens(currentChunk),
      });

      // Overlap within the section
      const overlapStart = Math.max(0, currentChunk.length - overlapChars);
      let nextStart = currentChunk.slice(overlapStart).trim() + "\n\n" + trimmed;

      // Prepend breadcrumb context to continuation chunks
      if (isFirstChunk && section.breadcrumb) {
        isFirstChunk = false;
      }
      if (!isFirstChunk && section.breadcrumb) {
        nextStart = `[${section.breadcrumb}]\n\n` + nextStart;
      }

      currentChunk = nextStart;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmed : trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Split text into chunks, respecting markdown structure when present.
 *
 * - Markdown content: splits at heading boundaries, groups small sections,
 *   prepends breadcrumb context to continuation chunks.
 * - Non-markdown content: splits at paragraph boundaries with overlap
 *   (identical to previous behavior).
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

  // Non-markdown content → paragraph-only splitting (backward compatible)
  if (!hasMarkdownHeadings(cleaned)) {
    return chunkByParagraphs(cleaned, targetChars, overlapChars);
  }

  // ── Markdown-aware chunking ─────────────────────────────────────────────
  const sections = parseMarkdownSections(cleaned);
  const chunks: TextChunk[] = [];
  let currentChunk = "";

  for (const section of sections) {
    // Build section text: heading + body
    const sectionText = section.heading
      ? section.heading + (section.body ? "\n\n" + section.body : "")
      : section.body;

    if (!sectionText.trim()) continue;

    // Can we append this section to the current chunk?
    if (!currentChunk) {
      // First content — check if section fits in one chunk
      if (sectionText.length <= targetChars) {
        currentChunk = sectionText;
      } else {
        // Section too large — split internally
        const subChunks = chunkLargeSection(section, targetChars, overlapChars);
        if (subChunks.length > 1) {
          chunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1].content;
        } else if (subChunks.length === 1) {
          currentChunk = subChunks[0].content;
        }
      }
    } else if (currentChunk.length + sectionText.length + 2 <= targetChars) {
      // Section fits alongside current content
      currentChunk += "\n\n" + sectionText;
    } else {
      // Current chunk is full — finalize it (no overlap between sections)
      chunks.push({
        content: currentChunk.trim(),
        tokenCount: estimateTokens(currentChunk),
      });

      if (sectionText.length <= targetChars) {
        currentChunk = sectionText;
      } else {
        // Section too large — split internally
        const subChunks = chunkLargeSection(section, targetChars, overlapChars);
        if (subChunks.length > 1) {
          chunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1].content;
        } else if (subChunks.length === 1) {
          currentChunk = subChunks[0].content;
        } else {
          currentChunk = "";
        }
      }
    }
  }

  // Flush remaining content
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}
