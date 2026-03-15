/**
 * Event Subscriptions API
 * GET  /api/campaigns/[campaignId]/events — list subscriptions
 * POST /api/campaigns/[campaignId]/events — create subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_EVENT_TYPES = new Set([
  "whatsapp.message.received",
  "whatsapp.conversation.completed",
  "whatsapp.contact.tagged",
  "whatsapp.sequence.replied",
  "whatsapp.sequence.completed",
]);

function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "0.0.0.0" || hostname === "[::1]" || hostname === "::1") return true;
  if (hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".localhost")) return true;
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") return true;
  const parts = hostname.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  if (hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80")) return true;
  return false;
}

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

  if (!VALID_EVENT_TYPES.has(body.event_type)) {
    return NextResponse.json(
      { error: `Invalid event_type. Must be one of: ${[...VALID_EVENT_TYPES].join(", ")}` },
      { status: 400 }
    );
  }

  // URL validation + SSRF prevention
  try {
    const url = new URL(body.webhook_url);
    if (url.protocol !== "https:") {
      return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
    }
    if (isPrivateHost(url.hostname.toLowerCase())) {
      return NextResponse.json({ error: "Webhook URL must not point to a private/internal address" }, { status: 400 });
    }
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
