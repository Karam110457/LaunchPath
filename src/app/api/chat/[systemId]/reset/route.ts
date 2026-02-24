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
    .update({
      conversation_history: [],
      messages: null,
      direction_path: null,
      client_preferences: [],
      own_idea: null,
      tried_niche: null,
      what_went_wrong: null,
      growth_direction: null,
      location_city: null,
      location_target: null,
      ai_recommendations: null,
      chosen_recommendation: null,
      offer: null,
      demo_config: null,
      demo_url: null,
      current_step: 1,
      status: "in_progress",
    } as Record<string, unknown>)
    .eq("id", systemId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
