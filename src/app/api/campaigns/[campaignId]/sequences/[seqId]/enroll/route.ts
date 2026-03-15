/**
 * Sequence Enrollment API
 * POST /api/campaigns/[campaignId]/sequences/[seqId]/enroll
 * Body: { contactIds: string[] } or { filter: { tags?, status? } }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SequenceStep } from "@/lib/sequences/types";

type Params = { params: Promise<{ campaignId: string; seqId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { campaignId, seqId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // Load sequence
  const { data: sequence } = await fromAny("follow_up_sequences")
    .select("id, channel_id, steps, status")
    .eq("id", seqId)
    .eq("campaign_id", campaignId)
    .single();

  if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  if (sequence.status !== "active") {
    return NextResponse.json({ error: "Sequence must be active to enroll contacts" }, { status: 400 });
  }

  const steps = sequence.steps as SequenceStep[];
  if (steps.length === 0) {
    return NextResponse.json({ error: "Sequence has no steps" }, { status: 400 });
  }

  const body = (await req.json()) as {
    contactIds?: string[];
    filter?: { tags?: string[]; status?: string };
  };

  let contactIds: string[] = [];

  if (body.contactIds && body.contactIds.length > 0) {
    if (body.contactIds.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 contactIds per request" }, { status: 400 });
    }
    contactIds = body.contactIds;
  } else if (body.filter) {
    // Build filter query
    let query = fromAny("campaign_contacts")
      .select("id")
      .eq("channel_id", sequence.channel_id)
      .neq("status", "opted_out");

    if (body.filter.status) query = query.eq("status", body.filter.status);
    if (body.filter.tags && body.filter.tags.length > 0) {
      query = query.contains("tags", body.filter.tags);
    }

    const { data: contacts } = await query.limit(1000);
    contactIds = (contacts ?? []).map((c: { id: string }) => c.id);
  }

  if (contactIds.length === 0) {
    return NextResponse.json({ error: "No contacts to enroll" }, { status: 400 });
  }

  // Filter out opted_out contacts and already enrolled
  const { data: validContacts } = await fromAny("campaign_contacts")
    .select("id")
    .in("id", contactIds)
    .neq("status", "opted_out");

  const validIds = new Set((validContacts ?? []).map((c: { id: string }) => c.id));

  const { data: alreadyEnrolled } = await fromAny("contact_sequence_state")
    .select("contact_id")
    .eq("sequence_id", seqId)
    .in("contact_id", contactIds)
    .eq("status", "active");

  const alreadySet = new Set((alreadyEnrolled ?? []).map((s: { contact_id: string }) => s.contact_id));

  // Calculate first step send time
  const firstStepDelay = steps[0]?.delayMinutes ?? 0;
  const nextSendAt = new Date(Date.now() + firstStepDelay * 60 * 1000).toISOString();

  const inserts = contactIds
    .filter((id) => validIds.has(id) && !alreadySet.has(id))
    .map((contactId) => ({
      sequence_id: seqId,
      contact_id: contactId,
      current_step: 0,
      status: "active",
      next_send_at: nextSendAt,
    }));

  if (inserts.length === 0) {
    return NextResponse.json({ enrolled: 0, skipped: contactIds.length });
  }

  const { error } = await fromAny("contact_sequence_state").insert(inserts);

  if (error) {
    return NextResponse.json({ error: "Failed to enroll contacts" }, { status: 500 });
  }

  return NextResponse.json({
    enrolled: inserts.length,
    skipped: contactIds.length - inserts.length,
  });
}
