/**
 * Individual Contact API
 * GET    /api/campaigns/[campaignId]/contacts/[contactId] — single contact
 * PATCH  /api/campaigns/[campaignId]/contacts/[contactId] — update contact
 * DELETE /api/campaigns/[campaignId]/contacts/[contactId] — remove contact
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string; contactId: string }> };

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, campaignId: string, userId: string) {
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (!campaign) return null;

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .single();

  return channel;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { campaignId, contactId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const channel = await verifyOwnership(supabase, campaignId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contact, error } = await (supabase.from as any)("campaign_contacts")
    .select("*")
    .eq("id", contactId)
    .eq("channel_id", channel.id)
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { campaignId, contactId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const channel = await verifyOwnership(supabase, campaignId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    name?: string;
    email?: string;
    tags?: string[];
    status?: string;
    custom_fields?: Record<string, unknown>;
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updates.name = body.name?.trim() || null;
  if (body.email !== undefined) updates.email = body.email?.trim() || null;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.status !== undefined) {
    const allowed = ["active", "opted_out"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.custom_fields !== undefined) updates.custom_fields = body.custom_fields;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contact, error } = await (supabase.from as any)("campaign_contacts")
    .update(updates)
    .eq("id", contactId)
    .eq("channel_id", channel.id)
    .select("*")
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }

  return NextResponse.json({ contact });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { campaignId, contactId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const channel = await verifyOwnership(supabase, campaignId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("campaign_contacts")
    .delete()
    .eq("id", contactId)
    .eq("channel_id", channel.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
