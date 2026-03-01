/**
 * Agent CRUD API route.
 * PATCH /api/agents/[agentId] — Update agent fields
 * DELETE /api/agents/[agentId] — Delete agent and clean up storage
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = [
  "name",
  "description",
  "system_prompt",
  "personality",
  "model",
  "status",
] as const;

const VALID_STATUSES = new Set(["draft", "active", "paused"]);

export async function PATCH(
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

  const body = await request.json();

  // Whitelist updatable fields
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  if (updates.status && !VALID_STATUSES.has(updates.status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Snapshot current state before applying update (versioning)
  // Wrapped in try/catch so versioning failures don't block the update
  try {
    const { data: current } = await supabase
      .from("ai_agents")
      .select("name, description, system_prompt, personality, model, status")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single();

    if (current) {
      const { count } = await supabase
        .from("agent_versions")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId);

      const versionNumber = (count ?? 0) + 1;

      await supabase.from("agent_versions").insert({
        agent_id: agentId,
        user_id: user.id,
        version_number: versionNumber,
        name: current.name,
        description: current.description,
        system_prompt: current.system_prompt,
        personality: current.personality ?? {},
        model: current.model,
        status: current.status,
      });
    }
  } catch {
    // Versioning table may not exist yet — continue with the update
  }

  const { error } = await supabase
    .from("ai_agents")
    .update(updates)
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Clean up storage files before cascade deletes the document rows
  const { data: docs } = await supabase
    .from("agent_knowledge_documents")
    .select("file_path")
    .eq("agent_id", agentId)
    .not("file_path", "is", null);

  if (docs && docs.length > 0) {
    const paths = docs
      .map((d) => d.file_path)
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("agent-knowledge").remove(paths);
    }
  }

  // Delete agent (cascades: knowledge docs → chunks, conversations)
  const { error } = await supabase
    .from("ai_agents")
    .delete()
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
