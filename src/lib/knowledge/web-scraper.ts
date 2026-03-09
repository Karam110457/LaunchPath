/**
 * Website content scraper using fetch + cheerio.
 * Extracts main text content from a URL.
 */

import * as cheerio from "cheerio";

const MAX_CONTENT_LENGTH = 100 * 1024; // 100KB text limit
const FETCH_TIMEOUT_MS = 10_000;
const SPARSE_CONTENT_THRESHOLD = 200; // chars — below this, cheerio likely failed on a JS-heavy site
const JINA_TIMEOUT_MS = 15_000; // Jina renders JS so it's slower

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

/** Primary scraper: fetch + cheerio static HTML parsing. */
async function scrapeWithCheerio(url: string): Promise<ScrapedContent> {
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

/**
 * Fallback scraper using Jina AI Reader.
 * Jina renders JavaScript, extracts main content, and returns markdown.
 * Free tier, no API key required.
 */
async function scrapeWithJina(url: string): Promise<ScrapedContent> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);

  try {
    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: { Accept: "text/plain" },
    });

    if (!response.ok) {
      throw new Error(`Jina Reader failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    // Jina format: first line is often "Title: <title>" or "# <title>"
    const lines = text.split("\n");
    let title = "Untitled";
    let contentStart = 0;

    if (lines[0]?.startsWith("Title:")) {
      title = lines[0].slice(6).trim();
      contentStart = 1;
    } else if (lines[0]?.startsWith("# ")) {
      title = lines[0].slice(2).trim();
      contentStart = 1;
    }

    const content = lines
      .slice(contentStart)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_CONTENT_LENGTH);

    return { title, content };
  } finally {
    clearTimeout(timeout);
  }
}

/** Scrape a URL and extract its main text content. */
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  if (!validateUrl(url)) {
    throw new Error("Invalid or blocked URL");
  }

  // Primary: cheerio (fast, no external dependency)
  const cheerioResult = await scrapeWithCheerio(url);

  // Check if cheerio extracted enough content
  const cleanedLength = cheerioResult.content.replace(/\s+/g, " ").trim().length;

  if (cleanedLength >= SPARSE_CONTENT_THRESHOLD) {
    return cheerioResult;
  }

  // Fallback: Jina AI Reader (handles JS-rendered sites)
  try {
    const jinaResult = await scrapeWithJina(url);
    const jinaCleanedLength = jinaResult.content.replace(/\s+/g, " ").trim().length;

    if (jinaCleanedLength > cleanedLength) {
      return jinaResult;
    }
  } catch {
    // Jina failed — fall through to cheerio result
  }

  // Return cheerio result even if sparse (better than nothing)
  return cheerioResult;
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
