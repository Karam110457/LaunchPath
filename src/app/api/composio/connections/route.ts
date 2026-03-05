/**
 * /api/composio/connections
 *
 * GET  — list user's Composio connections
 * POST — verify/refresh a connection after OAuth callback
 * DELETE — disconnect an app
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComposioClient, flushComposio } from "@/lib/composio/client";
import type { ComposioAccountItem } from "@/lib/composio/types";
import { logger } from "@/lib/security/logger";

// ─── GET: list connections ────────────────────────────────────────────────────
// Reads from our local DB, then verifies against Composio's live state.
// Stale connections (deleted on Composio dashboard) are removed automatically.

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

  const localConnections = connections ?? [];

  // If no connections, skip verification
  if (localConnections.length === 0) {
    return NextResponse.json({ connections: [] });
  }

  // Verify active connections against Composio's live state.
  // This catches connections deleted/revoked from the Composio dashboard.
  try {
    const composio = getComposioClient();

    const result = await composio.connectedAccounts.list({
      userIds: [user.id],
    });

    const liveItems =
      (result as unknown as { items: ComposioAccountItem[] }).items ?? [];

    // Guard: if Composio returns an empty list (transient API issue),
    // don't wipe all local connections — return local data as-is.
    if (liveItems.length === 0 && localConnections.some((c) => c.status === "active")) {
      return NextResponse.json({ connections: localConnections });
    }

    // Build maps of live toolkit statuses for comparison
    const liveActiveToolkits = new Set<string>();
    const liveTransientToolkits = new Set<string>(); // INITIATED, INITIALIZING, EXPIRED
    for (const a of liveItems) {
      const slug = a.toolkit?.slug;
      if (!slug) continue;
      if (a.status === "ACTIVE") liveActiveToolkits.add(slug);
      else if (a.status !== "FAILED") liveTransientToolkits.add(slug);
    }

    // Find stale connections (marked active locally but not active on Composio).
    // Only delete if the connection is truly gone (FAILED or not found at all).
    // Transient states (INITIATED, EXPIRED) may resolve — don't delete those.
    const staleIds: string[] = [];
    const verified = localConnections.filter((c) => {
      if (c.status === "active" && !liveActiveToolkits.has(c.toolkit)) {
        if (liveTransientToolkits.has(c.toolkit)) {
          // Transient state — keep the local record, just mark as pending
          return true;
        }
        // Truly stale — no live connection found, or explicitly FAILED
        staleIds.push(c.id);
        return false;
      }
      return true;
    });

    // Remove truly stale connections from our DB
    if (staleIds.length > 0) {
      await supabase
        .from("user_composio_connections")
        .delete()
        .in("id", staleIds)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ connections: verified });
  } catch (err) {
    // If Composio verification fails, return local data (graceful degradation)
    logger.error("Failed to verify connections with Composio", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ connections: localConnections });
  }
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

    const items =
      (result as unknown as { items: ComposioAccountItem[] }).items ?? [];

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

      void flushComposio();
      return NextResponse.json({
        status: isActive ? "active" : "pending",
        accountId: match.id,
      });
    }

    void flushComposio();
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

  // Look up the Composio connected account ID before deleting locally
  const { data: conn } = await supabase
    .from("user_composio_connections")
    .select("composio_account_id")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  // Revoke the connection on Composio's side (tokens, OAuth grants)
  if (conn?.composio_account_id) {
    try {
      const composio = getComposioClient();
      await composio.connectedAccounts.delete(conn.composio_account_id);
    } catch (err) {
      // Log but don't block — local cleanup should still proceed
      logger.error("Failed to delete Composio connected account", {
        userId: user.id,
        composioAccountId: conn.composio_account_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Delete from our DB
  await supabase
    .from("user_composio_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id);

  void flushComposio();
  return NextResponse.json({ success: true });
}
