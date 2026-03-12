/**
 * GET /api/agents/[agentId]/impact
 *
 * Returns a summary of what will be destroyed if this agent is deleted.
 * Used by the delete confirmation dialog to show cascade impact.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
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

  // Verify ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Count campaigns linked to this agent
  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId);

  // Count active channels
  const { count: channelCount } = await supabase
    .from("agent_channels")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId);

  // Count end-user conversations (via channels)
  const { data: channels } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("agent_id", agentId);

  let conversationCount = 0;
  if (channels && channels.length > 0) {
    const channelIds = channels.map((c) => c.id);
    const { count } = await supabase
      .from("channel_conversations")
      .select("id", { count: "exact", head: true })
      .in("channel_id", channelIds);
    conversationCount = count ?? 0;
  }

  // Count subagents (children)
  const { count: subagentCount } = await supabase
    .from("ai_agents")
    .select("id", { count: "exact", head: true })
    .eq("parent_agent_id", agentId);

  // Count client assignments
  const { count: clientAssignmentCount } = await supabase
    .from("client_agents")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId);

  return NextResponse.json({
    campaigns: campaignCount ?? 0,
    channels: channelCount ?? 0,
    conversations: conversationCount,
    subagents: subagentCount ?? 0,
    clientAssignments: clientAssignmentCount ?? 0,
  });
}
