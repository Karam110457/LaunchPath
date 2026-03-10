/**
 * Portal Campaigns API
 * GET  /api/portal/campaigns — list client's campaigns with counts
 * POST /api/portal/campaigns — create campaign (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
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

export async function POST(request: NextRequest) {
  const { clientId, role, user } = await requireClientAuth();

  if (!canPerform(role, "campaign.create")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    agent_id?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (!body.agent_id) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify agent is assigned to this client
  const { data: assignment } = await supabase
    .from("client_agents")
    .select("id")
    .eq("client_id", clientId)
    .eq("agent_id", body.agent_id)
    .single();

  if (!assignment) {
    return NextResponse.json(
      { error: "Agent is not assigned to this client" },
      { status: 403 }
    );
  }

  // Look up the agency owner's user_id (campaigns.user_id must be agency owner for RLS chain)
  const { data: client } = await supabase
    .from("clients")
    .select("user_id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Use service client to insert with agency owner's user_id
  const serviceClient = createServiceClient();
  const { data: campaign, error } = await serviceClient
    .from("campaigns")
    .insert({
      user_id: client.user_id,
      agent_id: body.agent_id,
      client_id: clientId,
      name: body.name.trim(),
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Portal: failed to create campaign", { error, clientId, userId: user.id });
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  return NextResponse.json({ campaign }, { status: 201 });
}
