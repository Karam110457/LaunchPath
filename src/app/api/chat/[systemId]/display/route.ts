/**
 * Display messages API route.
 * PATCH /api/chat/[systemId]/display
 *
 * Saves the full client-side display messages (including cards) to the
 * user_systems.messages JSONB column so they can be restored on refresh.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
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

  const body = await request.json() as { displayMessages: unknown[] };
  const { displayMessages } = body;

  if (!Array.isArray(displayMessages)) {
    return NextResponse.json({ error: "displayMessages must be an array" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_systems")
    .update({ messages: displayMessages as unknown as Record<string, unknown>[] })
    .eq("id", systemId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
