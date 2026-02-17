/**
 * Reset endpoint — clears conversation history for a "Start Over" action.
 * POST /api/chat/[systemId]/reset
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const { systemId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await supabase
    .from("user_systems")
    .update({ conversation_history: [] })
    .eq("id", systemId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
