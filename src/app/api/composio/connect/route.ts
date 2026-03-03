/**
 * POST /api/composio/connect
 *
 * Initiates an OAuth connection for a Composio toolkit.
 * Returns a redirect URL for the OAuth flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    toolkit: string;
    toolkitName: string;
    toolkitIcon?: string;
  };

  const { toolkit, toolkitName, toolkitIcon } = body;

  if (!toolkit || !toolkitName) {
    return NextResponse.json(
      { error: "toolkit and toolkitName are required" },
      { status: 400 }
    );
  }

  try {
    const composio = getComposioClient();

    // Check if user already has an active connection for this toolkit.
    // Avoids creating duplicate connected accounts (Composio warns about this).
    type AccountItem = { id: string; toolkit: { slug: string }; status: string };
    const existing = await composio.connectedAccounts.list({
      userIds: [user.id],
      toolkitSlugs: [toolkit],
    });
    const items = (existing as unknown as { items: AccountItem[] }).items ?? [];
    const active = items.find(
      (a) => a.toolkit?.slug === toolkit && a.status === "ACTIVE"
    );

    if (active) {
      // Already connected — update our DB and return immediately
      await supabase.from("user_composio_connections").upsert(
        {
          user_id: user.id,
          toolkit,
          toolkit_name: toolkitName,
          toolkit_icon: toolkitIcon ?? null,
          status: "active",
          composio_account_id: active.id,
        },
        { onConflict: "user_id,toolkit" }
      );
      return NextResponse.json({ redirectUrl: null, status: "active" });
    }

    // Authorize the user for this toolkit via Composio SDK.
    // This handles both OAuth and API key flows — Composio returns
    // a hosted auth page URL for both.
    const connection = await composio.toolkits.authorize(user.id, toolkit);

    // Upsert the connection record in our DB
    await supabase.from("user_composio_connections").upsert(
      {
        user_id: user.id,
        toolkit,
        toolkit_name: toolkitName,
        toolkit_icon: toolkitIcon ?? null,
        status: "pending",
        composio_account_id: connection.id ?? null,
      },
      { onConflict: "user_id,toolkit" }
    );

    // For no-auth apps, redirectUrl may be null — mark active immediately
    if (!connection.redirectUrl) {
      await supabase
        .from("user_composio_connections")
        .update({ status: "active" })
        .eq("user_id", user.id)
        .eq("toolkit", toolkit);

      return NextResponse.json({ redirectUrl: null, status: "active" });
    }

    return NextResponse.json({
      redirectUrl: connection.redirectUrl,
    });
  } catch (err) {
    logger.error("Composio connect failed", {
      userId: user.id,
      toolkit,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to initiate connection. Please try again." },
      { status: 500 }
    );
  }
}
