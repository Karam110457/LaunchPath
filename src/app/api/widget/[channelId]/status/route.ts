/**
 * Widget Status Polling API
 * GET /api/widget/[channelId]/status?sessionId=X&since=N
 *
 * Lightweight endpoint for the widget to poll during human_takeover mode.
 * Returns conversation status and any new messages since the given index.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const since = parseInt(request.nextUrl.searchParams.get("since") ?? "0");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  const supabase = createServiceClient();

  // 'status' column from 20260315_portal_upgrade migration (not yet in generated types)
  const { data: row } = await supabase
    .from("channel_conversations")
    .select("messages")
    .eq("channel_id", channelId)
    .eq("session_id", sessionId)
    .single();

  const conversation = row as typeof row & { status?: string } | null;

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  const messages = (conversation.messages ?? []) as Array<{ role: string; content: string }>;
  const newMessages = messages.slice(since);

  return NextResponse.json(
    {
      status: conversation.status ?? "active",
      newMessages,
      totalMessages: messages.length,
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
