/**
 * Agent Tool CRUD
 * GET    /api/agents/[agentId]/tools/[toolId]  — fetch single tool
 * PATCH  /api/agents/[agentId]/tools/[toolId]  — update tool
 * DELETE /api/agents/[agentId]/tools/[toolId]  — delete tool
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { maskConfig, mergeConfig } from "@/lib/tools/mask-config";
import type { UpdateToolPayload } from "@/lib/tools/types";

type RouteParams = { params: Promise<{ agentId: string; toolId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { agentId, toolId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: tool, error } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("id", toolId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (error || !tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json({
    tool: {
      ...tool,
      config: maskConfig(tool.config as Record<string, unknown>),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { agentId, toolId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Load the existing tool (ownership check via user_id RLS)
  const { data: existing } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("id", toolId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdateToolPayload;
  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) updates.display_name = body.display_name.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled;

  if (body.agent_id !== undefined) {
    // Validate target agent exists and belongs to the same user
    const { data: targetAgent } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("id", body.agent_id)
      .eq("user_id", user.id)
      .single();

    if (!targetAgent) {
      return NextResponse.json({ error: "Target agent not found" }, { status: 404 });
    }

    updates.agent_id = body.agent_id;
  }

  if (body.config !== undefined) {
    // Merge incoming config — masked fields are preserved from stored value
    updates.config = mergeConfig(
      existing.config as Record<string, unknown>,
      body.config
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: tool, error } = await supabase
    .from("agent_tools")
    .update(updates)
    .eq("id", toolId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
  }

  return NextResponse.json({
    tool: {
      ...tool,
      config: maskConfig(tool.config as Record<string, unknown>),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { agentId, toolId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("agent_tools")
    .delete()
    .eq("id", toolId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
