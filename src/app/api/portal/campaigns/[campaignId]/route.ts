/**
 * Portal Campaign Detail API
 * GET   /api/portal/campaigns/[campaignId] — campaign detail with channels
 * PATCH /api/portal/campaigns/[campaignId] — update campaign (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
import { logger } from "@/lib/security/logger";

async function verifyCampaignAccess(campaignId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*, ai_agents(id, name), agent_channels(id, name, channel_type, is_enabled, config, token, allowed_origins)")
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .single();
  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const { clientId } = await requireClientAuth();

  const campaign = await verifyCampaignAccess(campaignId, clientId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get conversation counts per channel
  const supabase = await createClient();
  const channels = (campaign as Record<string, unknown>).agent_channels as Array<Record<string, unknown>> ?? [];
  const channelIds = channels.map((ch) => ch.id as string);

  let conversationCounts: Record<string, number> = {};
  if (channelIds.length > 0) {
    const { data: convos } = await supabase
      .from("channel_conversations")
      .select("channel_id")
      .in("channel_id", channelIds);

    for (const conv of convos ?? []) {
      const chId = conv.channel_id as string;
      conversationCounts[chId] = (conversationCounts[chId] ?? 0) + 1;
    }
  }

  // Strip sensitive fields from channel config before sending to portal users
  const SENSITIVE_CONFIG_KEYS = new Set([
    "accessToken", "access_token",
    "verifyToken", "verify_token",
    "webhookSecret", "webhook_secret",
    "appSecret", "app_secret",
  ]);

  const shapedChannels = channels.map((ch) => {
    const config = ch.config as Record<string, unknown> | null;
    let safeConfig = config;
    if (config && typeof config === "object") {
      safeConfig = Object.fromEntries(
        Object.entries(config).map(([k, v]) =>
          SENSITIVE_CONFIG_KEYS.has(k) ? [k, "••••" + String(v ?? "").slice(-4)] : [k, v]
        )
      );
    }
    return {
      ...ch,
      config: safeConfig,
      conversation_count: conversationCounts[ch.id as string] ?? 0,
    };
  });

  return NextResponse.json({
    campaign: {
      ...(campaign as Record<string, unknown>),
      agent_channels: shapedChannels,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const { clientId, role } = await requireClientAuth();

  if (!canPerform(role, "campaign.update")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const campaign = await verifyCampaignAccess(campaignId, clientId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    status?: string;
    channel_config?: Record<string, unknown>;
    channel_id?: string;
    allowed_origins?: string[];
  };

  const serviceClient = createServiceClient();

  // Update campaign fields
  const campaignUpdates: Record<string, unknown> = {};
  if (body.name?.trim()) campaignUpdates.name = body.name.trim();
  if (body.status && ["draft", "active", "paused"].includes(body.status)) {
    campaignUpdates.status = body.status;
  }

  if (Object.keys(campaignUpdates).length > 0) {
    const { error } = await serviceClient
      .from("campaigns")
      .update(campaignUpdates)
      .eq("id", campaignId);

    if (error) {
      logger.error("Portal: failed to update campaign", { error, campaignId });
      return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
  }

  // Update channel config if provided
  if (body.channel_id && body.channel_config) {
    // Verify the channel belongs to this campaign (prevents updating arbitrary channels)
    const { data: ownedChannel } = await serviceClient
      .from("agent_channels")
      .select("id, config")
      .eq("id", body.channel_id)
      .eq("campaign_id", campaignId)
      .single();

    if (!ownedChannel) {
      return NextResponse.json({ error: "Channel not found for this campaign" }, { status: 403 });
    }

    // Prevent portal users from overwriting sensitive config fields
    // Merge incoming config with existing, preserving secrets that portal can't see
    const existingConfig = (ownedChannel.config ?? {}) as Record<string, unknown>;
    const SENSITIVE_CONFIG_KEYS = new Set([
      "accessToken", "access_token",
      "verifyToken", "verify_token",
      "webhookSecret", "webhook_secret",
      "appSecret", "app_secret",
    ]);
    const mergedConfig = { ...existingConfig };
    for (const [key, value] of Object.entries(body.channel_config)) {
      // Skip masked values (portal sends back "••••xxxx") and sensitive keys
      if (SENSITIVE_CONFIG_KEYS.has(key)) continue;
      mergedConfig[key] = value;
    }

    const channelUpdates: Record<string, unknown> = {
      config: mergedConfig,
    };
    if (body.allowed_origins) {
      channelUpdates.allowed_origins = body.allowed_origins;
    }
    // If toggling campaign to active, enable the channel too
    if (body.status === "active") {
      channelUpdates.is_enabled = true;
    } else if (body.status === "paused") {
      channelUpdates.is_enabled = false;
    }

    const { error } = await serviceClient
      .from("agent_channels")
      .update(channelUpdates)
      .eq("id", body.channel_id)
      .eq("campaign_id", campaignId);

    if (error) {
      logger.error("Portal: failed to update channel", { error, channelId: body.channel_id });
      return NextResponse.json({ error: "Failed to update channel config" }, { status: 500 });
    }
  } else if (body.status) {
    // Toggle all channels for this campaign based on status
    const isEnabled = body.status === "active";
    await serviceClient
      .from("agent_channels")
      .update({ is_enabled: isEnabled })
      .eq("campaign_id", campaignId);
  }

  return NextResponse.json({ success: true });
}
