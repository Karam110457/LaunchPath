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
    case "calendly":
      result = await testCalendly(config);
      break;
    case "ghl":
      result = await testGHL(config);
      break;
    case "hubspot":
      result = await testHubSpot(config);
      break;
    case "human-handoff":
      result = await testHumanHandoff(config);
      break;
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

async function testCalendly(config: Record<string, unknown>): Promise<TestToolResult> {
  const url = config.booking_url as string;
  if (!url) return { success: false, message: "Booking URL is required." };

  try {
    new URL(url);
  } catch {
    return { success: false, message: "The URL you entered doesn't look valid. Make sure it starts with https://." };
  }

  if (!url.includes("calendly.com") && !url.includes("cal.com")) {
    // Still allow custom domains but warn
    return {
      success: true,
      message: "URL saved. Note: this doesn't appear to be a Calendly or Cal.com URL — double-check it works.",
    };
  }

  return { success: true, message: "Booking URL looks good!" };
}

async function testGHL(config: Record<string, unknown>): Promise<TestToolResult> {
  const apiKey = config.api_key as string;
  const locationId = config.location_id as string;

  if (!apiKey || !locationId) {
    return { success: false, message: "API Key and Location ID are both required." };
  }

  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 200 || res.status === 201) {
      return { success: true, message: "Connected to GoHighLevel successfully!" };
    }
    if (res.status === 401) {
      return { success: false, message: "Invalid API key. Check that you copied the full token from GoHighLevel." };
    }
    if (res.status === 422) {
      return { success: false, message: "Invalid Location ID. Check the value in your GoHighLevel settings." };
    }
    return { success: false, message: `GoHighLevel returned an unexpected status: ${res.status}` };
  } catch {
    return { success: false, message: "Could not reach GoHighLevel. Check your API key and try again." };
  }
}

async function testHubSpot(config: Record<string, unknown>): Promise<TestToolResult> {
  const token = config.access_token as string;

  if (!token) {
    return { success: false, message: "Access token is required." };
  }

  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 200) {
      return { success: true, message: "Connected to HubSpot successfully!" };
    }
    if (res.status === 401) {
      return { success: false, message: "Invalid access token. Make sure you copied the full token from your HubSpot private app." };
    }
    if (res.status === 403) {
      return { success: false, message: "Missing permissions. Enable crm.objects.contacts.write in your HubSpot private app scopes." };
    }
    return { success: false, message: `HubSpot returned an unexpected status: ${res.status}` };
  } catch {
    return { success: false, message: "Could not reach HubSpot. Check your token and try again." };
  }
}

async function testHumanHandoff(config: Record<string, unknown>): Promise<TestToolResult> {
  const webhookUrl = config.webhook_url as string | undefined;
  const email = config.notify_email as string | undefined;

  if (!webhookUrl && !email) {
    // Zero config is valid — handoff still works without notification
    return {
      success: true,
      message: "Human Handoff is ready. Add an email or webhook above to receive notifications when a handoff is triggered.",
    };
  }

  if (webhookUrl) {
    try {
      new URL(webhookUrl);
    } catch {
      return { success: false, message: "Webhook URL doesn't look valid. Make sure it starts with https://." };
    }
  }

  return { success: true, message: "Human Handoff is configured and ready." };
}

async function testWebhook(config: Record<string, unknown>): Promise<TestToolResult> {
  const url = config.url as string;

  if (!url) return { success: false, message: "Webhook URL is required." };

  try {
    new URL(url);
  } catch {
    return { success: false, message: "URL doesn't look valid. Make sure it starts with https://." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true, source: "launchpath-agent", timestamp: new Date().toISOString() }),
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

  // Dynamic import to avoid loading MCP SDK on routes that don't need it
  try {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );

    const client = new Client({ name: "launchpath-test", version: "1.0.0" }, {});
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

    await client.connect(transport);
    const { tools } = await client.listTools();
    await client.close();

    return {
      success: true,
      message: `Connected! Found ${tools.length} tool${tools.length !== 1 ? "s" : ""} on this server.`,
      details: { toolCount: tools.length },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Could not connect to MCP server: ${msg}` };
  }
}
