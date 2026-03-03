/**
 * GET /api/composio/tools?toolkit=gmail
 *
 * Returns the available actions for a Composio toolkit.
 * Uses the direct tools API (not session) to avoid meta tools.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";

export interface ComposioToolAction {
  slug: string;
  name: string;
  description: string;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const toolkit = searchParams.get("toolkit");

  if (!toolkit) {
    return NextResponse.json(
      { error: "toolkit query param is required" },
      { status: 400 }
    );
  }

  try {
    const composio = getComposioClient();

    // Use getRawComposioTools to get actual toolkit actions (not session meta tools).
    // Session.tools() includes MANAGE_CONNECTIONS, MULTI_EXECUTE_TOOL etc.
    // which are Composio internal tools, not what we want here.
    const rawTools = await composio.tools.getRawComposioTools({
      toolkits: [toolkit],
      important: true,
      limit: 50,
    });

    // rawTools is Tool[] with { slug, name, description, toolkit }
    const tools: ComposioToolAction[] = (
      rawTools as unknown as Array<{
        slug: string;
        name: string;
        description?: string;
      }>
    ).map((t) => {
      // Format slug for display: GOOGLECALENDAR_CREATE_EVENT → Create Event
      const displayName = t.name || t.slug
        .replace(/^[A-Z]+_/, "") // remove toolkit prefix
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        slug: t.slug,
        name: displayName,
        description: t.description ?? "",
      };
    });

    return NextResponse.json({ tools });
  } catch (err) {
    logger.error("Composio tools fetch failed", {
      userId: user.id,
      toolkit,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to fetch tools for this app" },
      { status: 500 }
    );
  }
}
