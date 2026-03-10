/**
 * Client Agent Assignment API (agency-side)
 * GET    /api/clients/[clientId]/agents — list assigned agents
 * POST   /api/clients/[clientId]/agents — assign agent
 * DELETE /api/clients/[clientId]/agents — unassign agent
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify ownership
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data: assignments, error } = await supabase
    .from("client_agents")
    .select("id, agent_id, created_at, ai_agents(id, name)")
    .eq("client_id", clientId);

  if (error) {
    logger.error("Failed to fetch client agents", { error, clientId });
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }

  return NextResponse.json({ agents: assignments ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const body = (await request.json()) as { agent_id?: string };
  if (!body.agent_id) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  // Verify agency owns this agent
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", body.agent_id)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { data: assignment, error } = await supabase
    .from("client_agents")
    .insert({
      client_id: clientId,
      agent_id: body.agent_id,
      assigned_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Agent already assigned" }, { status: 409 });
    }
    logger.error("Failed to assign agent", { error, clientId, agentId: body.agent_id });
    return NextResponse.json({ error: "Failed to assign agent" }, { status: 500 });
  }

  return NextResponse.json({ assignment }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { agent_id?: string };
  if (!body.agent_id) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("client_agents")
    .delete()
    .eq("client_id", clientId)
    .eq("agent_id", body.agent_id);

  if (error) {
    logger.error("Failed to unassign agent", { error, clientId, agentId: body.agent_id });
    return NextResponse.json({ error: "Failed to unassign agent" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
