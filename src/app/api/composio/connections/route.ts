/**
 * /api/composio/connections
 *
 * GET  — list user's Composio connections
 * POST — verify/refresh a connection after OAuth callback
 * DELETE — disconnect an app
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient } from "@/lib/composio/client";
import { logger } from "@/lib/security/logger";

// ─── GET: list connections ────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: connections } = await supabase
    .from("user_composio_connections")
    .select("*")
    .eq("user_id", user.id)
    .order("connected_at", { ascending: false });

  return NextResponse.json({ connections: connections ?? [] });
}

// ─── POST: verify connection after OAuth ──────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { toolkit: string };
  const { toolkit } = body;

  if (!toolkit) {
    return NextResponse.json(
      { error: "toolkit is required" },
      { status: 400 }
    );
  }

  try {
    const composio = getComposioClient();

    // Check if the user has an active connection for this toolkit
    const accounts = await composio.connectedAccounts.list({
      userIds: [user.id],
      statuses: ["ACTIVE"],
    });

    // Find the matching toolkit connection
    const match = (accounts as unknown as Array<{ id: string; toolkitSlug?: string; toolkit_slug?: string }>)
      ?.find(
        (a) =>
          (a.toolkitSlug ?? a.toolkit_slug) === toolkit
      );

    if (match) {
      // Update our record to active
      await supabase
        .from("user_composio_connections")
        .update({
          status: "active",
          composio_account_id: match.id,
        })
        .eq("user_id", user.id)
        .eq("toolkit", toolkit);

      return NextResponse.json({ status: "active", accountId: match.id });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    logger.error("Composio connection verify failed", {
      userId: user.id,
      toolkit,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to verify connection" },
      { status: 500 }
    );
  }
}

// ─── DELETE: disconnect an app ────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("id");

  if (!connectionId) {
    return NextResponse.json(
      { error: "Connection id is required" },
      { status: 400 }
    );
  }

  // Delete from our DB (Composio tokens are managed by them)
  await supabase
    .from("user_composio_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
