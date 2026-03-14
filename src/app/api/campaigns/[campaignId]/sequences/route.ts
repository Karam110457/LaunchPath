/**
 * Sequences API
 * GET  /api/campaigns/[campaignId]/sequences  — list sequences
 * POST /api/campaigns/[campaignId]/sequences  — create sequence
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  const { data: sequences, error } = await fromAny("follow_up_sequences")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 });
  }

  // Get enrolled counts per sequence
  const seqIds = (sequences ?? []).map((s: { id: string }) => s.id);
  let enrolledCounts: Record<string, number> = {};

  if (seqIds.length > 0) {
    const { data: states } = await fromAny("contact_sequence_state")
      .select("sequence_id, status")
      .in("sequence_id", seqIds);

    if (states) {
      enrolledCounts = {};
      for (const s of states as { sequence_id: string; status: string }[]) {
        enrolledCounts[s.sequence_id] = (enrolledCounts[s.sequence_id] ?? 0) + 1;
      }
    }
  }

  const result = (sequences ?? []).map((seq: Record<string, unknown>) => ({
    ...seq,
    enrolled_count: enrolledCounts[seq.id as string] ?? 0,
  }));

  return NextResponse.json({ sequences: result });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "No channel found" }, { status: 400 });
  }

  const body = (await req.json()) as {
    name: string;
    description?: string;
    steps?: { stepNumber: number; delayMinutes: number; templateId: string; stopOnReply?: boolean }[];
    auto_enroll?: { on_tag?: string[]; on_ingest?: boolean };
    stop_on_reply?: boolean;
    stop_on_tags?: string[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("follow_up_sequences")
    .insert({
      campaign_id: campaignId,
      channel_id: channel.id,
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      steps: body.steps ?? [],
      auto_enroll: body.auto_enroll ?? {},
      stop_on_reply: body.stop_on_reply ?? true,
      stop_on_tags: body.stop_on_tags ?? [],
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });
  }

  return NextResponse.json({ sequence }, { status: 201 });
}
