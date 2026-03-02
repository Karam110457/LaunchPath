/**
 * Agent conversations API.
 * GET /api/agents/[agentId]/chat/conversations       — list summaries
 * GET /api/agents/[agentId]/chat/conversations?id=xxx — get single with full messages
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const conversationId = request.nextUrl.searchParams.get("id");

  // Single conversation with full messages
  if (conversationId) {
    const { data, error } = await supabase
      .from("agent_conversations")
      .select("id, title, messages, created_at, updated_at")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation: data });
  }

  // List summaries (no full messages)
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("id, title, messages, created_at, updated_at")
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summaries = (data ?? []).map((row) => {
    const msgs = Array.isArray(row.messages) ? row.messages : [];
    const firstUserMsg = msgs.find(
      (m: Record<string, unknown>) => m.role === "user"
    );
    return {
      id: row.id,
      title:
        row.title ??
        (typeof firstUserMsg?.content === "string"
          ? firstUserMsg.content.slice(0, 50)
          : null),
      updated_at: row.updated_at,
      preview:
        typeof firstUserMsg?.content === "string"
          ? firstUserMsg.content.slice(0, 80)
          : null,
      message_count: msgs.length,
    };
  });

  return NextResponse.json({ conversations: summaries });
}
