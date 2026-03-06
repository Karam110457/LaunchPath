/**
 * Subagents API
 * GET  /api/agents/[agentId]/subagents — list child agents
 * POST /api/agents/[agentId]/subagents — create child agent + linking tool record
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";

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

  const { data: subagents } = await supabase
    .from("ai_agents")
    .select("id, name, description, personality, model, status")
    .eq("parent_agent_id", agentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ subagents: subagents ?? [] });
}

export async function POST(
  req: NextRequest,
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

  // Verify parent agent ownership
  const { data: parent } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!parent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    name?: string;
    description?: string;
  };

  const childName = body.name?.trim() || "New Sub-Agent";

  // 1. Create child agent
  const { data: child, error: childError } = await supabase
    .from("ai_agents")
    .insert({
      user_id: user.id,
      parent_agent_id: agentId,
      name: childName,
      description: body.description?.trim() || null,
      system_prompt: `You are a helpful sub-agent named "${childName}". Respond clearly and concisely.`,
      personality: { avatar_emoji: "🤖" },
      model: "claude-sonnet-4-5-20250929",
      status: "draft",
    })
    .select("id, name, description, personality, model, status")
    .single();

  if (childError || !child) {
    logger.error("Failed to create child agent", { error: childError });
    return NextResponse.json(
      { error: "Failed to create sub-agent" },
      { status: 500 }
    );
  }

  // 2. Create agent_tools link on parent
  const { error: toolError } = await supabase.from("agent_tools").insert({
    agent_id: agentId,
    user_id: user.id,
    tool_type: "subagent",
    display_name: childName,
    description: `Delegate tasks to ${childName}.`,
    config: {
      target_agent_id: child.id,
      target_agent_name: childName,
      instructions: "",
      max_turns: 5,
    },
  });

  if (toolError) {
    logger.error("Failed to create subagent tool link", { error: toolError });
    // Clean up the child agent since the link failed
    await supabase.from("ai_agents").delete().eq("id", child.id);
    return NextResponse.json(
      { error: "Failed to link sub-agent" },
      { status: 500 }
    );
  }

  return NextResponse.json({ child }, { status: 201 });
}
