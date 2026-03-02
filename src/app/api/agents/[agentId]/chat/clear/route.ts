/**
 * Delete an agent test conversation.
 * POST /api/agents/[agentId]/chat/clear
 *
 * Body: { conversationId: string }
 */

import { NextRequest, NextResponse } from "next/server";
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

  let body: { conversationId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body — fall back to legacy delete-all behavior
  }

  if (body.conversationId) {
    // Delete specific conversation by ID
    await supabase
      .from("agent_conversations")
      .delete()
      .eq("id", body.conversationId)
      .eq("user_id", user.id);
  } else {
    // Legacy: delete all conversations for this agent+user
    await supabase
      .from("agent_conversations")
      .delete()
      .eq("agent_id", agentId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
