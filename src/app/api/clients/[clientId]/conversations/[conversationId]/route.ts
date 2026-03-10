/**
 * Dashboard Client Conversation Detail API
 * GET /api/clients/[clientId]/conversations/[conversationId] — detail with messages
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; conversationId: string }> }
) {
  const { clientId, conversationId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify the conversation belongs to this client
  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("*, agent_channels(campaign_id, campaigns(id, client_id))")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const channel = (conversation as Record<string, unknown>).agent_channels as Record<string, unknown> | null;
  const campaign = channel?.campaigns as Record<string, unknown> | null;

  // Must belong to this client and the agency user
  if (campaign?.client_id !== clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Also verify the agency user owns these campaigns
  const { data: ownership } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaign.id as string)
    .eq("user_id", user.id)
    .single();

  if (!ownership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = conversation as typeof conversation & { status?: string };

  return NextResponse.json({
    conversation: {
      id: row.id,
      session_id: row.session_id,
      messages: row.messages ?? [],
      metadata: row.metadata ?? null,
      created_at: row.created_at,
    },
  });
}
