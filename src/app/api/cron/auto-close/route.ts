/**
 * Auto-Close Stale Widget Conversations
 * POST /api/cron/auto-close
 *
 * Closes widget conversations that have been inactive for 24+ hours.
 * WhatsApp conversations are excluded — session management is handled
 * by Meta's 24-hour window, not by closing on our side.
 *
 * Primary scheduling: pg_cron (auto_close_stale_widget_conversations function).
 * This route is kept as a manual/admin fallback.
 *
 * Requires CRON_SECRET header for security.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/security/logger";

const STALE_HOURS = 24;

export async function POST(request: NextRequest) {
  // Verify cron secret (skip in development)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();

  // Fetch widget channels only — WhatsApp conversations stay open
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id, config")
    .eq("is_enabled", true)
    .eq("channel_type", "widget");

  // Build a map of channel_id → autoClose hours (skip disabled channels)
  const channelHoursMap = new Map<string, number>();
  for (const ch of channels ?? []) {
    const cfg = (ch.config ?? {}) as Record<string, unknown>;
    const autoClose = cfg.autoClose as { enabled?: boolean; hours?: number } | undefined;
    if (autoClose?.enabled === false) continue; // explicitly disabled — skip
    const hours = autoClose?.hours ?? STALE_HOURS;
    channelHoursMap.set(ch.id, hours);
  }

  if (channelHoursMap.size === 0) {
    return NextResponse.json({ closed: 0 });
  }

  // Use the minimum hours as the broadest cutoff, then filter per-channel
  const minHours = Math.min(...channelHoursMap.values());
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - minHours);
  const cutoffISO = cutoff.toISOString();

  // Find active/paused conversations not updated since broadest cutoff
  // 'status' column added by migration, not in generated types yet — use '*' and cast
  const { data: staleRows, error } = await supabase
    .from("channel_conversations")
    .select("*")
    .in("status" as string, ["active", "paused"])
    .in("channel_id", Array.from(channelHoursMap.keys()))
    .lt("updated_at", cutoffISO)
    .limit(500);

  if (error) {
    logger.error("Auto-close: failed to query stale conversations", { error });
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  // Filter by each channel's specific hours threshold
  const stale = (staleRows ?? []) as Array<{ id: string; channel_id: string; updated_at: string; status?: string }>;
  const now = Date.now();
  const ids = stale
    .filter((c) => {
      const hours = channelHoursMap.get(c.channel_id) ?? STALE_HOURS;
      const threshold = hours * 60 * 60 * 1000;
      return now - new Date(c.updated_at).getTime() >= threshold;
    })
    .map((c) => c.id);

  if (ids.length === 0) {
    return NextResponse.json({ closed: 0 });
  }

  const { error: updateError } = await supabase
    .from("channel_conversations")
    .update({ status: "closed" } as Record<string, unknown>)
    .in("id", ids);

  if (updateError) {
    logger.error("Auto-close: failed to update conversations", { error: updateError });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  logger.info("Auto-close: closed stale conversations", { count: ids.length });

  return NextResponse.json({ closed: ids.length });
}
