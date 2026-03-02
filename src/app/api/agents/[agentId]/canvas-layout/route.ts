/**
 * Canvas layout persistence route.
 * PATCH /api/agents/[agentId]/canvas-layout — Save node positions
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

  const body = await request.json() as { positions: Record<string, { x: number; y: number }> };

  if (!body.positions || typeof body.positions !== "object") {
    return NextResponse.json({ error: "positions required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ai_agents")
    .update({ canvas_layout: body.positions })
    .eq("id", agentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
