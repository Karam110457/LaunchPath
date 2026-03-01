import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as cheerio from "cheerio";
import { BROWSER_HEADERS } from "@/lib/knowledge/web-scraper";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";

const FETCH_TIMEOUT_MS = 10_000;

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const h = parsed.hostname;
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.startsWith("192.168.") ||
      h.startsWith("10.") ||
      h.startsWith("172.") ||
      h === "0.0.0.0"
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(getClientIdentifier(request), "wizard/discover-pages", 10);
  if (!rl.success) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (!validateUrl(url)) {
    return NextResponse.json(
      { error: "Invalid or blocked URL" },
      { status: 400 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 502 },
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const baseUrl = new URL(url);
    const baseDomain = baseUrl.hostname;

    // Collect same-domain links
    const seen = new Set<string>();
    const pages: Array<{ url: string; title: string }> = [];

    // Always include the root URL itself
    seen.add(baseUrl.href.replace(/\/$/, ""));
    pages.push({
      url: baseUrl.href.replace(/\/$/, ""),
      title: $("title").text().trim() || baseUrl.hostname,
    });

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      let resolved: URL;
      try {
        resolved = new URL(href, url);
      } catch {
        return;
      }

      // Same domain only
      if (resolved.hostname !== baseDomain) return;

      // Skip anchors, javascript, mailto, tel
      if (
        resolved.protocol !== "http:" &&
        resolved.protocol !== "https:"
      )
        return;

      // Normalize: strip hash, trailing slash
      resolved.hash = "";
      const normalized = resolved.href.replace(/\/$/, "");

      // Skip already seen, skip files (images, pdfs, etc.)
      if (seen.has(normalized)) return;
      const ext = normalized.split(".").pop()?.toLowerCase();
      if (
        ext &&
        ["jpg", "jpeg", "png", "gif", "svg", "pdf", "zip", "css", "js"].includes(ext)
      )
        return;

      seen.add(normalized);
      const linkText = $(el).text().trim();
      pages.push({
        url: normalized,
        title: linkText || resolved.pathname,
      });
    });

    return NextResponse.json({ pages: pages.slice(0, 50) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to discover pages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
