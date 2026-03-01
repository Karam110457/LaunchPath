/**
 * Website content scraper using fetch + cheerio.
 * Extracts main text content from a URL.
 */

import * as cheerio from "cheerio";

const MAX_CONTENT_LENGTH = 100 * 1024; // 100KB text limit
const FETCH_TIMEOUT_MS = 10_000;

/** Browser-like headers to avoid 403 blocks from sites that reject bots. */
export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

export interface ScrapedContent {
  title: string;
  content: string;
}

/** Validate URL is safe to scrape (no internal IPs, must be http/https). */
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    // Block internal/private IPs
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Scrape a URL and extract its main text content. */
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  if (!validateUrl(url)) {
    throw new Error("Invalid or blocked URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("URL does not return HTML content");
    }

    const html = await response.text();
    return extractContent(html);
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract main text content from HTML. */
function extractContent(html: string): ScrapedContent {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, iframe, svg, nav, footer, header").remove();
  $("[role='navigation'], [role='banner'], [role='contentinfo']").remove();
  $(".nav, .navbar, .footer, .sidebar, .menu, .cookie-banner, .popup").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || "Untitled";

  // Try to find main content area
  let contentEl = $("main, article, [role='main']").first();
  if (!contentEl.length) {
    contentEl = $(".content, .main, #content, #main, .post, .article").first();
  }
  if (!contentEl.length) {
    contentEl = $("body");
  }

  // Extract text, preserving paragraph structure
  let text = "";
  contentEl.find("p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre").each((_, el) => {
    const elText = $(el).text().trim();
    if (elText) {
      text += elText + "\n\n";
    }
  });

  // Fallback: if no structured content found, use all text
  if (!text.trim()) {
    text = contentEl.text();
  }

  // Clean and truncate
  const cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);

  return { title, content: cleaned };
}
