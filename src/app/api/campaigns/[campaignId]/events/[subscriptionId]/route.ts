/**
 * Individual Event Subscription API
 * PATCH  — update subscription
 * DELETE — remove subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string; subscriptionId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { campaignId, subscriptionId } = await params;
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

  const body = (await req.json()) as {
    webhook_url?: string;
    secret?: string;
    is_enabled?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (body.webhook_url !== undefined) updates.webhook_url = body.webhook_url;
  if (body.secret !== undefined) updates.secret = body.secret || null;
  if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription, error } = await (supabase.from as any)("event_subscriptions")
    .update(updates)
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !subscription) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ subscription });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { campaignId, subscriptionId } = await params;
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
  const { error } = await (supabase.from as any)("event_subscriptions")
    .delete()
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
