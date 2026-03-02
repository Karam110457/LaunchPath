/**
 * POST /api/agents/[agentId]/tools/mcp-discover
 *
 * Connect to an MCP server and return its available tools.
 * Used in the setup UI to preview what the server offers before saving.
 *
 * Body: { server_url: string }
 * Returns: { tools: MCPDiscoveredTool[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MCPDiscoveredTool } from "@/lib/tools/types";

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

  const { server_url } = (await request.json()) as { server_url: string };

  if (!server_url) {
    return NextResponse.json({ error: "server_url is required" }, { status: 400 });
  }

  try {
    new URL(server_url);
  } catch {
    return NextResponse.json({ error: "Invalid server URL" }, { status: 400 });
  }

  try {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );

    const client = new Client({ name: "launchpath-discover", version: "1.0.0" }, {});
    const transport = new StreamableHTTPClientTransport(new URL(server_url));

    await client.connect(transport);
    const { tools: mcpTools } = await client.listTools();
    await client.close();

    const discovered: MCPDiscoveredTool[] = mcpTools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: (t.inputSchema as Record<string, unknown>) ?? {},
    }));

    return NextResponse.json({ tools: discovered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to connect to MCP server: ${message}` },
      { status: 502 }
    );
  }
}
