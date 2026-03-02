/**
 * Agent Tools API
 * GET  /api/agents/[agentId]/tools  — list tools (config masked)
 * POST /api/agents/[agentId]/tools  — create tool
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCatalogEntry } from "@/lib/tools/catalog";
import { maskConfig } from "@/lib/tools/mask-config";
import type { CreateToolPayload } from "@/lib/tools/types";

const ALLOWED_TOOL_TYPES = new Set([
  "calendly",
  "ghl",
  "hubspot",
  "webhook",
  "mcp",
]);

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

  // Verify agent ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { data: tools, error } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }

  const masked = (tools ?? []).map((t) => ({
    ...t,
    config: maskConfig(t.config as Record<string, unknown>),
  }));

  return NextResponse.json({ tools: masked });
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

  // Verify agent ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = (await request.json()) as CreateToolPayload;
  const { tool_type, display_name, description, config } = body;

  if (!tool_type || !ALLOWED_TOOL_TYPES.has(tool_type)) {
    return NextResponse.json({ error: "Invalid tool_type" }, { status: 400 });
  }

  if (!display_name || typeof display_name !== "string") {
    return NextResponse.json({ error: "display_name is required" }, { status: 400 });
  }

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  // Validate required config fields
  const catalogEntry = getCatalogEntry(tool_type);
  if (catalogEntry) {
    for (const field of catalogEntry.setupFields) {
      if (field.required && !config?.[field.key]) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }
  }

  const { data: tool, error } = await supabase
    .from("agent_tools")
    .insert({
      agent_id: agentId,
      user_id: user.id,
      tool_type,
      display_name: display_name.trim(),
      description: description.trim(),
      config: config ?? {},
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
  }

  return NextResponse.json(
    {
      tool: {
        ...tool,
        config: maskConfig(tool.config as Record<string, unknown>),
      },
    },
    { status: 201 }
  );
}
