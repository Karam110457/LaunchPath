/**
 * Individual Sequence API
 * GET    — sequence detail with enrollment stats
 * PATCH  — update sequence
 * DELETE — remove sequence (cascades enrollment)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string; seqId: string }> };

async function verifyAccess(supabase: Awaited<ReturnType<typeof createClient>>, campaignId: string, userId: string) {
  const { data } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { campaignId, seqId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await verifyAccess(supabase, campaignId, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  const { data: sequence, error } = await fromAny("follow_up_sequences")
    .select("*")
    .eq("id", seqId)
    .eq("campaign_id", campaignId)
    .single();

  if (error || !sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  // Enrollment stats
  const { data: states } = await fromAny("contact_sequence_state")
    .select("status")
    .eq("sequence_id", seqId);

  const stats: Record<string, number> = {};
  for (const s of (states ?? []) as { status: string }[]) {
    stats[s.status] = (stats[s.status] ?? 0) + 1;
  }

  return NextResponse.json({ sequence, enrollment_stats: stats });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { campaignId, seqId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await verifyAccess(supabase, campaignId, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    name?: string;
    description?: string;
    steps?: { stepNumber: number; delayMinutes: number; templateId: string; stopOnReply?: boolean }[];
    auto_enroll?: { on_tag?: string[]; on_ingest?: boolean };
    stop_on_reply?: boolean;
    stop_on_tags?: string[];
    status?: string;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.steps !== undefined) {
    if (!Array.isArray(body.steps)) {
      return NextResponse.json({ error: "steps must be an array" }, { status: 400 });
    }
    if (body.steps.length > 20) {
      return NextResponse.json({ error: "Maximum 20 steps per sequence" }, { status: 400 });
    }
    for (let i = 0; i < body.steps.length; i++) {
      const s = body.steps[i];
      if (typeof s.stepNumber !== "number" || typeof s.delayMinutes !== "number" || typeof s.templateId !== "string") {
        return NextResponse.json({ error: `Step ${i}: stepNumber (number), delayMinutes (number), and templateId (string) are required` }, { status: 400 });
      }
      if (s.delayMinutes < 0 || s.delayMinutes > 525600) {
        return NextResponse.json({ error: `Step ${i}: delayMinutes must be between 0 and 525600 (365 days)` }, { status: 400 });
      }
      if (!s.templateId.trim()) {
        return NextResponse.json({ error: `Step ${i}: templateId must not be empty` }, { status: 400 });
      }
    }
    updates.steps = body.steps;
  }
  if (body.auto_enroll !== undefined) updates.auto_enroll = body.auto_enroll;
  if (body.stop_on_reply !== undefined) updates.stop_on_reply = body.stop_on_reply;
  if (body.stop_on_tags !== undefined) updates.stop_on_tags = body.stop_on_tags;
  if (body.status !== undefined) {
    const allowed = ["draft", "active", "paused", "archived"];
    if (!allowed.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updates.status = body.status;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("follow_up_sequences")
    .update(updates)
    .eq("id", seqId)
    .eq("campaign_id", campaignId)
    .select("*")
    .single();

  if (error || !sequence) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ sequence });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { campaignId, seqId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await verifyAccess(supabase, campaignId, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("follow_up_sequences")
    .delete()
    .eq("id", seqId)
    .eq("campaign_id", campaignId);

  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
