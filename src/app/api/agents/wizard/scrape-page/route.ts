import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeWebsite } from "@/lib/knowledge/web-scraper";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";

export async function POST(request: NextRequest) {
  const rl = rateLimit(getClientIdentifier(request), "wizard/scrape-page", 20);
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

  try {
    const result = await scrapeWebsite(url);
    return NextResponse.json({
      title: result.title,
      content: result.content,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to scrape page";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
