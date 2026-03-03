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

    // Initiate the OAuth connection via Composio SDK.
    // The user.id is used as the Composio entity/user identifier.
    const connection = await composio.connectedAccounts.link(
      user.id,
      toolkit
    );

    // Upsert the connection record in our DB
    await supabase.from("user_composio_connections").upsert(
      {
        user_id: user.id,
        toolkit,
        toolkit_name: toolkitName,
        toolkit_icon: toolkitIcon ?? null,
        status: "pending",
        composio_account_id: null,
      },
      { onConflict: "user_id,toolkit" }
    );

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
