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

    // Check for any non-failed connection for this toolkit.
    // Right after OAuth, the status may be INITIATED before transitioning to ACTIVE.
    const result = await composio.connectedAccounts.list({
      userIds: [user.id],
      toolkitSlugs: [toolkit],
    });

    // The response has { items: [...] } where each item has toolkit.slug and status
    type AccountItem = {
      id: string;
      toolkit: { slug: string };
      status: string;
    };
    const items =
      (result as unknown as { items: AccountItem[] }).items ?? [];

    // Prefer ACTIVE, fall back to INITIATED (connection still propagating)
    const active = items.find(
      (a) => a.toolkit?.slug === toolkit && a.status === "ACTIVE"
    );
    const initiated = items.find(
      (a) =>
        a.toolkit?.slug === toolkit &&
        (a.status === "INITIATED" || a.status === "INITIALIZING")
    );
    const match = active ?? initiated;

    if (match) {
      const isActive = match.status === "ACTIVE";

      // Update our record
      await supabase
        .from("user_composio_connections")
        .update({
          status: isActive ? "active" : "pending",
          composio_account_id: match.id,
        })
        .eq("user_id", user.id)
        .eq("toolkit", toolkit);

      return NextResponse.json({
        status: isActive ? "active" : "pending",
        accountId: match.id,
      });
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
