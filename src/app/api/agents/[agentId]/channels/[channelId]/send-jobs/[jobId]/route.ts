/**
 * Single Send Job API
 * GET    /api/agents/[agentId]/channels/[channelId]/send-jobs/[jobId]
 * DELETE /api/agents/[agentId]/channels/[channelId]/send-jobs/[jobId]  — cancel job
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ agentId: string; channelId: string; jobId: string }>;
  }
) {
  const { channelId, jobId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job } = await (supabase.from as any)("template_send_jobs")
    .select("*, whatsapp_templates(name, language, category)")
    .eq("id", jobId)
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ agentId: string; channelId: string; jobId: string }>;
  }
) {
  const { channelId, jobId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job } = await (supabase.from as any)("template_send_jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json(
      { error: "Cannot cancel a completed or failed job" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("template_send_jobs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  return NextResponse.json({ success: true });
}
