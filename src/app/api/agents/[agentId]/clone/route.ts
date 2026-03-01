/**
 * Clone Agent API route.
 * POST /api/agents/[agentId]/clone
 *
 * Creates a copy of the agent with "Copy of" prefix and draft status.
 * Does NOT clone knowledge documents.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  // Fetch source agent
  const { data: source } = await supabase
    .from("ai_agents")
    .select(
      "name, description, system_prompt, personality, enabled_tools, model, template_id, wizard_config"
    )
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!source) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Insert clone
  const { data: clone, error } = await supabase
    .from("ai_agents")
    .insert({
      user_id: user.id,
      name: `Copy of ${source.name}`,
      description: source.description,
      system_prompt: source.system_prompt,
      personality: source.personality,
      enabled_tools: source.enabled_tools,
      model: source.model,
      template_id: source.template_id,
      wizard_config: source.wizard_config,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !clone) {
    return NextResponse.json({ error: "Clone failed" }, { status: 500 });
  }

  return NextResponse.json({ id: clone.id });
}
