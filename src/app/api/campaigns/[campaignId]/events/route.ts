/**
 * Event Subscriptions API
 * GET  /api/campaigns/[campaignId]/events — list subscriptions
 * POST /api/campaigns/[campaignId]/events — create subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { campaignId } = await params;
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

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!channel) return NextResponse.json({ subscriptions: [] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions } = await (supabase.from as any)("event_subscriptions")
    .select("*")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ subscriptions: subscriptions ?? [] });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { campaignId } = await params;
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

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!channel) return NextResponse.json({ error: "No channel found" }, { status: 400 });

  const body = (await req.json()) as {
    event_type: string;
    webhook_url: string;
    secret?: string;
  };

  if (!body.event_type || !body.webhook_url) {
    return NextResponse.json({ error: "event_type and webhook_url are required" }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(body.webhook_url);
  } catch {
    return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription, error } = await (supabase.from as any)("event_subscriptions")
    .insert({
      user_id: user.id,
      channel_id: channel.id,
      event_type: body.event_type,
      webhook_url: body.webhook_url,
      secret: body.secret || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  return NextResponse.json({ subscription }, { status: 201 });
}
