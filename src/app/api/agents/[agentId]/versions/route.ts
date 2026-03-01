/**
 * Agent versions API.
 * GET  /api/agents/[agentId]/versions — List version history
 * POST /api/agents/[agentId]/versions — Revert to a specific version
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

  const { data: versions, error } = await supabase
    .from("agent_versions")
    .select("id, version_number, name, description, model, status, created_at")
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .order("version_number", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }

  return NextResponse.json({ versions: versions ?? [] });
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

  const body = (await request.json()) as { versionId?: string };
  const { versionId } = body;

  if (!versionId) {
    return NextResponse.json(
      { error: "versionId is required" },
      { status: 400 }
    );
  }

  // Fetch the version snapshot
  const { data: version } = await supabase
    .from("agent_versions")
    .select("*")
    .eq("id", versionId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!version) {
    return NextResponse.json(
      { error: "Version not found" },
      { status: 404 }
    );
  }

  // Apply the snapshot as an update to the agent
  const { error: updateError } = await supabase
    .from("ai_agents")
    .update({
      name: version.name,
      description: version.description,
      system_prompt: version.system_prompt,
      personality: version.personality,
      model: version.model,
      status: version.status,
    })
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to revert" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, revertedTo: version.version_number });
}
