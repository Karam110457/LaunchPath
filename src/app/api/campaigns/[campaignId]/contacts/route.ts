/**
 * Campaign Contacts API
 * GET  /api/campaigns/[campaignId]/contacts  — list contacts
 * POST /api/campaigns/[campaignId]/contacts  — create single contact
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const E164_RE = /^\+[1-9]\d{6,14}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify campaign ownership
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get channel_id for this campaign
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json({ contacts: [], total: 0 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const tagsParam = searchParams.get("tags"); // comma-separated
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from as any)("campaign_contacts")
    .select("*", { count: "exact" })
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    // Sanitize search to prevent PostgREST filter injection:
    // strip characters that have special meaning in PostgREST filter syntax
    const sanitized = search.replace(/[%_().,]/g, "").trim();
    if (sanitized) {
      query = query.or(
        `name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
      );
    }
  }

  if (tagsParam) {
    const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      query = query.contains("tags", tags);
    }
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) {
    query = query.gte("created_at", `${from}T00:00:00Z`);
  }
  if (to) {
    query = query.lte("created_at", `${to}T23:59:59Z`);
  }

  const { data: contacts, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }

  return NextResponse.json({
    contacts: contacts ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
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
    .select("id, agent_id")
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
    return NextResponse.json(
      { error: "No channel found for this campaign. Deploy the campaign first." },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    phone: string;
    name?: string;
    email?: string;
    tags?: string[];
    custom_fields?: Record<string, unknown>;
    source?: string;
  };

  if (!body.phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  // Normalize phone
  let phone = body.phone.replace(/\s+/g, "");
  if (!phone.startsWith("+")) phone = `+${phone}`;

  if (!E164_RE.test(phone)) {
    return NextResponse.json(
      { error: "Invalid phone format. Use E.164 format (e.g., +1234567890)" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contact, error } = await (supabase.from as any)("campaign_contacts")
    .upsert(
      {
        user_id: user.id,
        channel_id: channel.id,
        agent_id: campaign.agent_id,
        phone,
        name: body.name?.trim() || null,
        email: body.email?.trim() || null,
        tags: body.tags ?? [],
        custom_fields: body.custom_fields ?? {},
        source: body.source ?? "manual",
      },
      { onConflict: "channel_id,phone" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }

  return NextResponse.json({ contact }, { status: 201 });
}
