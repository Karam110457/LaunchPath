/**
 * Clear agent test chat history.
 * POST /api/agents/[agentId]/chat/clear
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
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

  // Delete the conversation row (will be recreated on next message)
  await supabase
    .from("agent_conversations")
    .delete()
    .eq("agent_id", agentId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
