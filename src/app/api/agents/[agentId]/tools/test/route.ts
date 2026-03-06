/**
 * POST /api/agents/[agentId]/tools/test
 *
 * Tests a tool configuration before saving.
 * Body: { tool_type, config }
 * Returns: { success, message, details? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { validatePublicUrl } from "@/lib/tools/ssrf";
import { applyAuth } from "@/lib/tools/integrations/http";
import type { TestToolPayload, TestToolResult, HttpAuthType, HttpAuthConfig } from "@/lib/tools/types";

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

  const validation = validatePublicUrl(url);
  if (!validation.valid) return { success: false, message: validation.message! };

  try {
    // Mirror the exact payload shape that real webhook execution sends (flat, not nested)
    const payload = {
      source: "launchpath-agent",
      timestamp: new Date().toISOString(),
      message: "Test ping from LaunchPath agent builder",
    };
    const body = JSON.stringify(payload);

    const headers: Record<string, string> = { "Content-Type": "application/json" };

    // Sign with HMAC if a signing secret is configured
    const secret = config.secret as string | undefined;
    if (secret) {
      const sig = createHmac("sha256", secret).update(body).digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${sig}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      return { success: true, message: `Webhook received the test ping (HTTP ${res.status}).` };
    }
    return { success: false, message: `Webhook returned an error: HTTP ${res.status}.` };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, message: "Webhook timed out after 15 seconds." };
    }
    return { success: false, message: "Could not reach the webhook URL. Make sure it's publicly accessible." };
  }
}

async function testHttp(config: Record<string, unknown>): Promise<TestToolResult> {
  const url = config.url as string;
  const method = (config.method as string) || "GET";

  if (!url) return { success: false, message: "URL is required." };

  // Replace template params for validation
  const testUrl = url.replace(/\{[^}]+\}/g, "test");
  const validation = validatePublicUrl(testUrl);
  if (!validation.valid) return { success: false, message: validation.message! };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    // Use the actual configured method (not HEAD) — many APIs reject HEAD on POST endpoints
    const needsBody = method === "POST" || method === "PUT" || method === "PATCH";
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(needsBody ? { "Content-Type": "application/json" } : {}),
    };

    // Apply auth so the test uses the same credentials as real execution
    const authType = (config.auth_type as HttpAuthType) || "none";
    const authConfig = config.auth_config as HttpAuthConfig | undefined;
    const finalUrl = applyAuth(headers, testUrl, authType, authConfig);

    const res = await fetch(finalUrl, {
      method,
      signal: controller.signal,
      headers,
      body: needsBody ? JSON.stringify({}) : undefined,
    });
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    let preview = "";
    if (method === "GET" && contentType.includes("json")) {
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

  const validation = validatePublicUrl(serverUrl);
  if (!validation.valid) return { success: false, message: validation.message! };

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
