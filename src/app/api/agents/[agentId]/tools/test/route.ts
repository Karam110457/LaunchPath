/**
 * POST /api/agents/[agentId]/tools/test
 *
 * Tests a tool configuration before saving.
 * Body: { tool_type, config }
 * Returns: { success, message, details? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TestToolPayload, TestToolResult } from "@/lib/tools/types";

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

  const { tool_type, config } = (await request.json()) as TestToolPayload;

  let result: TestToolResult;

  switch (tool_type) {
    case "webhook":
      result = await testWebhook(config);
      break;
    case "mcp":
      result = await testMCP(config);
      break;
    default:
      result = { success: false, message: "Unknown tool type" };
  }

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// Per-tool test implementations
// ---------------------------------------------------------------------------

async function testWebhook(config: Record<string, unknown>): Promise<TestToolResult> {
  const url = config.url as string;

  if (!url) return { success: false, message: "Webhook URL is required." };

  try {
    new URL(url);
  } catch {
    return { success: false, message: "URL doesn't look valid. Make sure it starts with https://." };
  }

  try {
    // Mirror the exact payload shape that real webhook execution sends
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { message: "Test ping from LaunchPath agent builder" },
        source: "launchpath-agent",
        timestamp: new Date().toISOString(),
      }),
    });

    if (res.ok || res.status < 500) {
      return { success: true, message: `Webhook received the test ping (HTTP ${res.status}).` };
    }
    return { success: false, message: `Webhook returned an error: HTTP ${res.status}.` };
  } catch {
    return { success: false, message: "Could not reach the webhook URL. Make sure it's publicly accessible." };
  }
}

async function testMCP(config: Record<string, unknown>): Promise<TestToolResult> {
  const serverUrl = config.server_url as string;

  if (!serverUrl) return { success: false, message: "MCP Server URL is required." };

  try {
    new URL(serverUrl);
  } catch {
    return { success: false, message: "Server URL doesn't look valid." };
  }

  try {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );

    const client = new Client({ name: "launchpath-test", version: "1.0.0" }, {});
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

    await client.connect(transport);
    try {
      const { tools } = await client.listTools();
      return {
        success: true,
        message: `Connected! Found ${tools.length} tool${tools.length !== 1 ? "s" : ""} on this server.`,
        details: { toolCount: tools.length },
      };
    } finally {
      // Always close — even if listTools() throws
      await client.close().catch(() => {});
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Could not connect to MCP server: ${msg}` };
  }
}
