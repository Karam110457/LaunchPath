/**
 * Single Channel API (authenticated — agent owner only)
 * PATCH  /api/agents/[agentId]/channels/[channelId]  — update channel settings
 * DELETE /api/agents/[agentId]/channels/[channelId]  — remove channel
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; channelId: string }> }
) {
  const { agentId, channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify channel ownership (agent_id + user_id match)
  const { data: existing } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("id", channelId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    allowed_origins?: string[];
    rate_limit_rpm?: number | null;
    is_enabled?: boolean;
  };

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = body.name.trim();
  }

  if (body.allowed_origins !== undefined) {
    if (!Array.isArray(body.allowed_origins)) {
      return NextResponse.json(
        { error: "allowed_origins must be an array" },
        { status: 400 }
      );
    }
    updates.allowed_origins = body.allowed_origins;
  }

  if (body.rate_limit_rpm !== undefined) {
    if (
      body.rate_limit_rpm !== null &&
      (typeof body.rate_limit_rpm !== "number" ||
        body.rate_limit_rpm < 1 ||
        body.rate_limit_rpm > 1000)
    ) {
      return NextResponse.json(
        { error: "rate_limit_rpm must be between 1 and 1000, or null" },
        { status: 400 }
      );
    }
    updates.rate_limit_rpm = body.rate_limit_rpm;
  }

  if (body.is_enabled !== undefined) {
    if (typeof body.is_enabled !== "boolean") {
      return NextResponse.json(
        { error: "is_enabled must be a boolean" },
        { status: 400 }
      );
    }
    updates.is_enabled = body.is_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data: channel, error } = await supabase
    .from("agent_channels")
    .update(updates)
    .eq("id", channelId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update channel", {
      channelId,
      error: error.message,
    });
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    );
  }

  return NextResponse.json({ channel });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string; channelId: string }> }
) {
  const { agentId, channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("agent_channels")
    .delete()
    .eq("id", channelId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Failed to delete channel", {
      channelId,
      agentId,
      error: error.message,
    });
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 }
    );
  }

  logger.info("Channel deleted", {
    channelId,
    agentId,
    userId: user.id,
  });

  return NextResponse.json({ success: true });
}
