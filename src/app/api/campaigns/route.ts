/**
 * Campaigns API (authenticated)
 * GET  /api/campaigns  — list user's campaigns with agent info
 * POST /api/campaigns  — create a new campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*, ai_agents(name, personality), clients(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaigns: campaigns ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    agent_id?: string;
    client_name?: string;
    client_website?: string;
    client_id?: string;
  };

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (!body.agent_id || typeof body.agent_id !== "string") {
    return NextResponse.json(
      { error: "agent_id is required" },
      { status: 400 }
    );
  }

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

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      agent_id: body.agent_id,
      name: body.name.trim(),
      client_name: body.client_name?.trim() || null,
      client_website: body.client_website?.trim() || null,
      client_id: body.client_id || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaign }, { status: 201 });
}
