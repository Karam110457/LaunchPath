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
    .select(
      "id, version_number, name, description, system_prompt, personality, model, status, wizard_config, tool_guidelines, change_title, change_description, knowledge_snapshot, created_at"
    )
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .order("version_number", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch versions:", error.message);
    return NextResponse.json({ versions: [] });
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
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Create a safety snapshot of the CURRENT state before reverting
  try {
    const { data: current } = await supabase
      .from("ai_agents")
      .select("name, description, system_prompt, personality, model, status, wizard_config, tool_guidelines")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single();

    if (current) {
      const { data: knowledgeDocs } = await supabase
        .from("agent_knowledge_documents")
        .select("id, source_type, source_name, status")
        .eq("agent_id", agentId);

      const { data: maxRow } = await supabase
        .from("agent_versions")
        .select("version_number")
        .eq("agent_id", agentId)
        .order("version_number", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = ((maxRow?.version_number as number) ?? 0) + 1;

      await supabase.from("agent_versions").insert({
        agent_id: agentId,
        user_id: user.id,
        version_number: nextVersion,
        name: current.name,
        description: current.description,
        system_prompt: current.system_prompt,
        personality: current.personality ?? {},
        model: current.model,
        status: current.status,
        wizard_config: current.wizard_config ?? null,
        tool_guidelines: current.tool_guidelines ?? null,
        change_title: `Before revert to v${version.version_number}`,
        change_description: null,
        knowledge_snapshot: knowledgeDocs ?? [],
      });
    }
  } catch (err) {
    console.error("Pre-revert snapshot failed:", err instanceof Error ? err.message : err);
    // Continue with revert even if snapshot fails
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
      wizard_config: version.wizard_config ?? null,
      tool_guidelines: version.tool_guidelines ?? null,
    })
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to revert" }, { status: 500 });
  }

  // Return the reverted agent state so the client can sync form state
  return NextResponse.json({
    ok: true,
    revertedTo: version.version_number,
    agent: {
      name: version.name,
      description: version.description,
      system_prompt: version.system_prompt,
      personality: version.personality,
      model: version.model,
      status: version.status,
      wizard_config: version.wizard_config ?? null,
      tool_guidelines: version.tool_guidelines ?? null,
    },
  });
}
