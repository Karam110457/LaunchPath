/**
 * POST /api/agents/[agentId]/tools/generate-description
 *
 * Generates an AI-powered tool description based on the agent's
 * system prompt and the selected Composio actions.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";

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

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("system_prompt")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    appName: string;
    actions: string[];
  };

  const { appName, actions } = body;

  if (!appName || typeof appName !== "string") {
    return NextResponse.json({ error: "appName is required" }, { status: 400 });
  }

  const actionList = (actions ?? []).slice(0, 10).join(", ");
  const systemPromptSnippet = (agent.system_prompt ?? "").slice(0, 1500);

  const result = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You write concise tool instructions for AI agents. Given an agent's purpose and a connected app, write 1-2 sentences telling the agent WHEN and HOW to use this app. Be specific to the agent's domain. Do not be generic. Do not use quotes. Output ONLY the instruction text, nothing else.`,
    prompt: `Agent's purpose:\n${systemPromptSnippet}\n\nConnected app: ${appName}\nAvailable actions: ${actionList || "general actions"}\n\nWrite the tool instruction:`,
  });

  return NextResponse.json({ description: result.text.trim() });
}
