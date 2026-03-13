/**
 * Portal Conversation Detail API
 * GET   /api/portal/conversations/[conversationId] — detail with messages
 * PATCH /api/portal/conversations/[conversationId] — update status (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
import { logger } from "@/lib/security/logger";

async function verifyConversationAccess(conversationId: string, clientId: string) {
  const supabase = await createClient();

  // Verify conversation belongs to a campaign owned by this client
  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("*, agent_channels(id, name, campaign_id, campaigns(id, name, client_id))")
    .eq("id", conversationId)
    .single();

  if (!conversation) return null;

  const channel = (conversation as Record<string, unknown>).agent_channels as Record<string, unknown> | null;
  const campaign = channel?.campaigns as Record<string, unknown> | null;
  if (campaign?.client_id !== clientId) return null;

  return conversation;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { clientId } = await requireClientAuth();

  const conversation = await verifyConversationAccess(conversationId, clientId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { clientId, role, user } = await requireClientAuth();

  const body = (await request.json()) as {
    status?: string;
  };

  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const validStatuses = ["active", "paused", "human_takeover", "closed"];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Check permission based on action
  const actionMap: Record<string, string> = {
    paused: "conversation.pause",
    human_takeover: "conversation.takeover",
    active: "conversation.resume",
    closed: "conversation.close",
  };

  if (!canPerform(role, actionMap[body.status] as Parameters<typeof canPerform>[1])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const conversation = await verifyConversationAccess(conversationId, clientId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const currentStatus = (conversation as Record<string, unknown>).status as string | undefined;

  // Prevent re-closing an already closed conversation
  if (currentStatus === "closed") {
    return NextResponse.json(
      { error: "Conversation is already closed" },
      { status: 409 }
    );
  }

  // Prevent concurrent takeover — if already taken over by a different user, reject
  if (body.status === "human_takeover" && currentStatus === "human_takeover") {
    const existingOwner = (conversation as Record<string, unknown>).taken_over_by as string | null;
    if (existingOwner && existingOwner !== user.id) {
      return NextResponse.json(
        { error: "Conversation is already taken over by another team member" },
        { status: 409 }
      );
    }
  }

  const updates: Record<string, unknown> = { status: body.status };

  if (body.status === "human_takeover") {
    updates.taken_over_by = user.id;
    updates.taken_over_at = new Date().toISOString();

    // Generate warm handoff summary from conversation messages
    const messages = ((conversation as Record<string, unknown>).messages ?? []) as Array<{ role: string; content: string }>;
    const visibleMessages = messages.filter((m) => ["user", "assistant"].includes(m.role));
    if (visibleMessages.length > 0) {
      const lastUserMessages = visibleMessages
        .filter((m) => m.role === "user")
        .slice(-3)
        .map((m) => m.content);
      const summary = `Visitor asked about: ${lastUserMessages.join(" | ")}. ${visibleMessages.length} messages exchanged.`;
      const existingMeta = ((conversation as Record<string, unknown>).metadata ?? {}) as Record<string, unknown>;
      updates.metadata = {
        ...existingMeta,
        handoff_summary: summary,
        handoff_at: new Date().toISOString(),
      };
    }
  } else if (body.status === "paused") {
    updates.paused_at = new Date().toISOString();
  } else if (body.status === "active") {
    // Resuming — clear takeover fields
    updates.taken_over_by = null;
    updates.taken_over_at = null;
    updates.paused_at = null;
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("channel_conversations")
    .update(updates)
    .eq("id", conversationId);

  if (error) {
    logger.error("Portal: failed to update conversation status", { error, conversationId });
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: body.status });
}
