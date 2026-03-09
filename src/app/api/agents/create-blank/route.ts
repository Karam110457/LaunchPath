import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer questions clearly and concisely.";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: newAgent, error: insertError } = await supabase
    .from("ai_agents")
    .insert({
      user_id: user.id,
      name: "New Agent",
      description: null,
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      personality: {},
      enabled_tools: [],
      template_id: null,
      model: "claude-sonnet-4-5-20250929",
      status: "draft",
      wizard_config: null,
    })
    .select("id")
    .single();

  if (insertError || !newAgent) {
    logger.error("Failed to create blank agent", {
      error: insertError?.message,
      userId: user.id,
    });
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }

  // Create initial version snapshot (v1)
  try {
    await supabase.from("agent_versions").insert({
      agent_id: newAgent.id,
      user_id: user.id,
      version_number: 1,
      name: "New Agent",
      description: null,
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      personality: {},
      model: "claude-sonnet-4-5-20250929",
      status: "draft",
      change_title: "Initial version",
      change_description: null,
      knowledge_snapshot: [],
    });
  } catch {
    // Versioning is non-blocking
  }

  logger.info("Blank agent created", {
    agentId: newAgent.id,
    userId: user.id,
  });

  return NextResponse.json({ agentId: newAgent.id });
}
