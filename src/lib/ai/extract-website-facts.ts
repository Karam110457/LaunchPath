/**
 * extract-website-facts.ts — Uses Haiku to extract structured business facts
 * from scraped website content. This produces a concise summary that the
 * agent-builder (Sonnet) can use to write a much better system prompt,
 * without burning tokens on raw HTML noise.
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { logger } from "@/lib/security/logger";

const MODEL = "claude-haiku-4-5-20251001";

const EXTRACTION_PROMPT = `You are a business analyst. Given raw website content, extract the key facts a customer-facing AI agent would need to know.

Output a concise summary (max 600 words) covering ONLY what's present:
- **Business name & what they do** (1-2 sentences)
- **Products/services offered** (bullet list)
- **Pricing** (if mentioned)
- **Location & service area** (if mentioned)
- **Business hours** (if mentioned)
- **Key policies** (returns, cancellations, warranties — if mentioned)
- **Unique selling points / differentiators**
- **Contact info** (phone, email — if mentioned)
- **Industry-specific terminology** the agent should use naturally

Skip any section where the website doesn't provide that information. Do NOT make up or infer facts not present in the content. Be factual and concise.`;

export interface WebsiteFactsResult {
  /** Structured summary of business facts extracted from website content */
  summary: string;
  /** Number of pages processed */
  pagesProcessed: number;
}

/**
 * Extract key business facts from scraped website pages using Haiku.
 * Concatenates page content (capped to avoid excessive tokens) and runs
 * a single extraction call.
 */
export async function extractWebsiteFacts(
  pages: Array<{ url: string; title: string; content: string }>,
): Promise<WebsiteFactsResult> {
  if (pages.length === 0) {
    return { summary: "", pagesProcessed: 0 };
  }

  // Build a combined document from all pages, capping total at ~12k chars
  // to keep Haiku input reasonable (~3k tokens)
  const MAX_TOTAL_CHARS = 12_000;
  const perPageBudget = Math.floor(MAX_TOTAL_CHARS / pages.length);

  const combined = pages
    .map((p) => {
      const trimmed = p.content.slice(0, Math.max(perPageBudget, 1500));
      return `--- ${p.title} (${p.url}) ---\n${trimmed}`;
    })
    .join("\n\n");

  try {
    const result = await generateText({
      model: anthropic(MODEL),
      system: EXTRACTION_PROMPT,
      prompt: combined,
      maxOutputTokens: 800,
    });

    return {
      summary: result.text.trim(),
      pagesProcessed: pages.length,
    };
  } catch (err) {
    logger.error("Failed to extract website facts via Haiku", {
      error: err instanceof Error ? err.message : String(err),
      pageCount: pages.length,
    });

    // Fallback: return truncated raw content so generation still works
    const fallback = pages
      .map((p) => `- ${p.title}: ${p.content.slice(0, 300)}`)
      .join("\n");

    return {
      summary: fallback,
      pagesProcessed: pages.length,
    };
  }
}
