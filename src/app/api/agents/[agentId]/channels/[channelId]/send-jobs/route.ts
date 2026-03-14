/**
 * Send Jobs List API
 * GET /api/agents/[agentId]/channels/[channelId]/send-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string; channelId: string }> }
) {
  const { channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobs, error } = await (supabase.from as any)("template_send_jobs")
    .select("*, whatsapp_templates(name, language, category)")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs ?? [] });
}
