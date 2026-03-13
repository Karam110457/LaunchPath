/**
 * Single Campaign API (authenticated)
 * GET    /api/campaigns/[campaignId]  — get campaign with channels
 * PATCH  /api/campaigns/[campaignId]  — update campaign
 * DELETE /api/campaigns/[campaignId]  — delete campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*, ai_agents(id, name, personality), clients(id, name, website, logo_url)")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (error || !campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  // Fetch channels linked to this campaign
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id);

  return NextResponse.json({
    campaign,
    channels: channels ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  const body = (await request.json()) as {
    name?: string;
    agent_id?: string;
    client_name?: string | null;
    client_website?: string | null;
    client_id?: string | null;
    status?: string;
  };

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 }
      );
    }
    updates.name = body.name.trim();
  }

  if (body.agent_id !== undefined) {
    // Verify agent ownership
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("id", body.agent_id)
      .eq("user_id", user.id)
      .single();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    updates.agent_id = body.agent_id;
  }

  if (body.client_name !== undefined) {
    updates.client_name = body.client_name?.trim() || null;
  }

  if (body.client_website !== undefined) {
    updates.client_website = body.client_website?.trim() || null;
  }

  if (body.client_id !== undefined) {
    updates.client_id = body.client_id || null;
  }

  if (body.status !== undefined) {
    const validStatuses = new Set(["draft", "active", "paused"]);
    if (!validStatuses.has(body.status)) {
      return NextResponse.json(
        { error: "status must be draft, active, or paused" },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  updates.updated_at = new Date().toISOString();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }

  // Sync channel is_enabled with campaign status to prevent state desync
  if (body.status === "active" || body.status === "paused") {
    const isEnabled = body.status === "active";
    await supabase
      .from("agent_channels")
      .update({ is_enabled: isEnabled })
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ campaign });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
