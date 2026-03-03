/**
 * GET /api/composio/tools?toolkit=gmail
 *
 * Returns the available actions for a connected Composio toolkit.
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

    // Create session scoped to this toolkit — filtering happens at creation
    const session = await composio.create(user.id, {
      toolkits: [toolkit],
    });

    // session.tools() returns VercelToolCollection (Record<string, Tool>)
    const sessionTools = await session.tools();

    // Extract metadata for the UI
    const tools: ComposioToolAction[] = Object.entries(sessionTools).map(
      ([slug, def]) => {
        const toolDef = def as { description?: string } | undefined;
        // Format slug for display: GMAIL_SEND_EMAIL → Send Email
        const displayName = slug
          .replace(/^[A-Z]+_/, "") // remove toolkit prefix
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          slug,
          name: displayName,
          description: toolDef?.description ?? "",
        };
      }
    );

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
