/**
 * Agent Channels API (authenticated — agent owner only)
 * GET  /api/agents/[agentId]/channels  — list deployed channels
 * POST /api/agents/[agentId]/channels  — create a new channel deployment
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChannelToken, generateWebhookPath } from "@/lib/channels/token";
import { maskConfig } from "@/lib/tools/mask-config";
import { logger } from "@/lib/security/logger";

const ALLOWED_CHANNEL_TYPES = new Set(["widget", "api", "whatsapp"]);

/** Channel types that require a webhook_path for inbound messages. */
const WEBHOOK_CHANNEL_TYPES = new Set(["whatsapp"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify agent ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { data: channels, error } = await supabase
    .from("agent_channels")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }

  // Mask sensitive fields (e.g. WhatsApp accessToken) before returning
  const masked = (channels ?? []).map((ch) => ({
    ...ch,
    config: maskConfig(ch.config as Record<string, unknown>),
  }));

  return NextResponse.json({ channels: masked });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify agent ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    channel_type?: string;
    name?: string;
    allowed_origins?: string[];
    rate_limit_rpm?: number;
    config?: Record<string, unknown>;
    campaign_id?: string;
  };

  const { channel_type, name, allowed_origins, rate_limit_rpm, config, campaign_id } = body;

  if (!channel_type || !ALLOWED_CHANNEL_TYPES.has(channel_type)) {
    return NextResponse.json(
      { error: "channel_type must be one of: widget, api, whatsapp" },
      { status: 400 }
    );
  }

  // Validate WhatsApp-specific config
  if (channel_type === "whatsapp") {
    const cfg = config as Record<string, unknown> | undefined;
    if (
      !cfg?.phoneNumberId ||
      !cfg?.accessToken ||
      !cfg?.verifyToken
    ) {
      return NextResponse.json(
        { error: "WhatsApp channels require phoneNumberId, accessToken, and verifyToken in config" },
        { status: 400 }
      );
    }
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  if (rate_limit_rpm !== undefined && rate_limit_rpm !== null) {
    if (typeof rate_limit_rpm !== "number" || rate_limit_rpm < 1 || rate_limit_rpm > 1000) {
      return NextResponse.json(
        { error: "rate_limit_rpm must be between 1 and 1000" },
        { status: 400 }
      );
    }
  }

  const token = generateChannelToken();
  const webhookPath = WEBHOOK_CHANNEL_TYPES.has(channel_type)
    ? generateWebhookPath()
    : null;

  const { data: channel, error } = await supabase
    .from("agent_channels")
    .insert({
      agent_id: agentId,
      user_id: user.id,
      channel_type,
      name: name.trim(),
      token,
      webhook_path: webhookPath,
      allowed_origins: allowed_origins ?? [],
      rate_limit_rpm: rate_limit_rpm ?? null,
      config: config ?? {},
      campaign_id: campaign_id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create channel", {
      agentId,
      channel_type,
      error: error.message,
    });
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }

  logger.info("Channel created", {
    channelId: channel.id,
    agentId,
    userId: user.id,
    channelType: channel_type,
  });

  // Mask sensitive config values before returning
  const maskedChannel = {
    ...channel,
    config: maskConfig(channel.config as Record<string, unknown>),
  };

  // Return with token — this is the only time the raw token is exposed
  return NextResponse.json({ channel: maskedChannel }, { status: 201 });
}
