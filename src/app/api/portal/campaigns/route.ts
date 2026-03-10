/**
 * Portal Campaigns API
 * GET  /api/portal/campaigns — list client's campaigns with counts
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClientAuth } from "@/lib/auth/guards";
import { logger } from "@/lib/security/logger";

export async function GET() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, status, agent_id, created_at, updated_at, ai_agents(name), agent_channels(id, is_enabled, channel_type)"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Portal: failed to fetch campaigns", { error, clientId });
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }

  const shaped = (campaigns ?? []).map((c) => {
    const raw = c as Record<string, unknown>;
    const channels = (raw.agent_channels ?? []) as { id: string; is_enabled: boolean; channel_type: string }[];
    const agent = raw.ai_agents as { name: string } | null;
    return {
      id: raw.id,
      name: raw.name,
      status: raw.status,
      agent_id: raw.agent_id,
      agent_name: agent?.name ?? null,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      channel_count: channels.length,
      has_active_widget: channels.some((ch) => ch.channel_type === "widget" && ch.is_enabled),
    };
  });

  return NextResponse.json({ campaigns: shaped });
}
