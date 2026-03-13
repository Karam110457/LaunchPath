/**
 * Widget Close Conversation API
 * POST /api/widget/[channelId]/close
 *
 * Allows the visitor to close their own conversation from the widget.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const origin = request.headers.get("origin") ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const supabase = createServiceClient();

  // Check if end-chat is enabled in channel config
  const { data: channelRow } = await supabase
    .from("agent_channels")
    .select("config")
    .eq("id", channelId)
    .single();

  const widgetConfig = (channelRow?.config ?? {}) as Record<string, unknown>;
  const endChatEnabled = (widgetConfig.endChat as { enabled?: boolean } | undefined)?.enabled !== false; // default: on

  if (!endChatEnabled) {
    return NextResponse.json(
      { error: "End chat is disabled for this channel" },
      { status: 403, headers: corsHeaders }
    );
  }

  // 'status' column added by migration, not in generated types yet — use '*' and cast
  const { data: row } = await supabase
    .from("channel_conversations")
    .select("*")
    .eq("channel_id", channelId)
    .eq("session_id", body.sessionId)
    .single();

  const conversation = row as typeof row & { status?: string } | null;

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  if (conversation.status === "closed") {
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }

  await supabase
    .from("channel_conversations")
    .update({ status: "closed" } as Record<string, unknown>)
    .eq("id", conversation.id);

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
