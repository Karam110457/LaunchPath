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
    case "http":
      result = await testHttp(config);
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

// Blocked internal network patterns (SSRF prevention)
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/169\.254\./,
];

async function testHttp(config: Record<string, unknown>): Promise<TestToolResult> {
  const url = config.url as string;
  const method = (config.method as string) || "GET";

  if (!url) return { success: false, message: "URL is required." };

  try {
    new URL(url.replace(/\{[^}]+\}/g, "placeholder")); // Replace template params for validation
  } catch {
    return { success: false, message: "URL doesn't look valid. Make sure it starts with https://." };
  }

  if (BLOCKED_URL_PATTERNS.some((p) => p.test(url))) {
    return { success: false, message: "Internal network addresses are not allowed." };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    // For test, use HEAD for GET requests, or send a minimal request
    const testMethod = method === "GET" ? "GET" : "HEAD";
    const res = await fetch(url.replace(/\{[^}]+\}/g, "test"), {
      method: testMethod,
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    let preview = "";
    if (testMethod === "GET" && contentType.includes("json")) {
      const text = await res.text();
      preview = text.slice(0, 200);
    }

    return {
      success: res.ok,
      message: res.ok
        ? `Endpoint reachable (HTTP ${res.status}).`
        : `Endpoint returned HTTP ${res.status}: ${res.statusText}.`,
      details: { status: res.status, contentType, preview: preview || undefined },
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, message: "Request timed out after 10 seconds." };
    }
    return { success: false, message: "Could not reach the endpoint. Make sure it's publicly accessible." };
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
