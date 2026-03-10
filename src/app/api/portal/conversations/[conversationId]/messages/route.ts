/**
 * Portal HITL Message Injection API
 * POST /api/portal/conversations/[conversationId]/messages
 *
 * Injects a human agent message into a conversation in human_takeover mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
import { logger } from "@/lib/security/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { clientId, role, user } = await requireClientAuth();

  if (!canPerform(role, "conversation.send_message")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await request.json()) as { message?: string };

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Load conversation and verify access
  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("id, messages, status, channel_id, agent_channels(campaign_id, campaigns(client_id))")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Verify ownership chain
  const channel = (conversation as Record<string, unknown>).agent_channels as Record<string, unknown> | null;
  const campaign = channel?.campaigns as Record<string, unknown> | null;
  if (campaign?.client_id !== clientId) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Only allow messages during human_takeover
  if (conversation.status !== "human_takeover") {
    return NextResponse.json(
      { error: "Can only send messages during human takeover" },
      { status: 409 }
    );
  }

  // Append human agent message
  const messages = (conversation.messages ?? []) as Array<Record<string, unknown>>;
  const newMessage = {
    role: "human_agent",
    content: body.message.trim(),
    timestamp: new Date().toISOString(),
    sent_by: user.id,
  };

  const updatedMessages = [...messages, newMessage];

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("channel_conversations")
    .update({ messages: updatedMessages as unknown as import("@/types/database").Json })
    .eq("id", conversationId);

  if (error) {
    logger.error("Portal: failed to inject message", { error, conversationId });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: newMessage });
}
