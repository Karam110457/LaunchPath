/**
 * Public Channel Chat API
 * POST /api/channels/[agentId]/chat
 *
 * Public endpoint for channel consumers (widgets, voice, SMS).
 * Authenticated via bearer token (from agent_channels), not Supabase session.
 * Uses the same runAgentChat() logic as the authenticated dashboard chat.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runAgentChat } from "@/lib/chat/run-agent-chat";
import { isChannelToken } from "@/lib/channels/token";
import { rateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { logger } from "@/lib/security/logger";
import type { AgentConversationMessage } from "@/lib/chat/agent-chat-types";
import type { Json } from "@/types/database";

const DEFAULT_RPM = 20;
const MAX_HISTORY_MESSAGES = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  // ---------------------------------------------------------------------------
  // 1. Extract and validate bearer token
  // ---------------------------------------------------------------------------

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !isChannelToken(token)) {
    return NextResponse.json(
      { error: "Missing or invalid channel token" },
      { status: 401 }
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Look up channel in DB (service role bypasses RLS)
  // ---------------------------------------------------------------------------

  const supabase = createServiceClient();

  const { data: channel } = await supabase
    .from("agent_channels")
    .select(
      "id, agent_id, user_id, channel_type, allowed_origins, rate_limit_rpm, is_enabled"
    )
    .eq("token", token)
    .eq("agent_id", agentId)
    .eq("is_enabled", true)
    .single();

  if (!channel) {
    return NextResponse.json(
      { error: "Invalid or disabled channel" },
      { status: 403 }
    );
  }

  // ---------------------------------------------------------------------------
  // 3. CORS origin check
  // ---------------------------------------------------------------------------

  const origin = request.headers.get("origin");
  const allowedOrigins = (channel.allowed_origins as string[]) ?? [];

  if (allowedOrigins.length > 0 && origin) {
    if (
      !allowedOrigins.includes(origin) &&
      !allowedOrigins.includes("*")
    ) {
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403 }
      );
    }
  }

  const corsOrigin = origin ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // ---------------------------------------------------------------------------
  // 4. Rate limiting (per channel + IP)
  // ---------------------------------------------------------------------------

  const clientIp = getClientIdentifier(request);
  const rateLimitKey = `channel:${channel.id}:${clientIp}`;
  const rpm = (channel.rate_limit_rpm as number | null) ?? DEFAULT_RPM;
  const rlResult = rateLimit(rateLimitKey, "channel-chat", rpm);

  if (!rlResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rlResult.retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(rlResult.retryAfter),
          ...corsHeaders,
        },
      }
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Parse request body
  // ---------------------------------------------------------------------------

  let body: {
    userMessage?: string;
    sessionId?: string;
    messages?: AgentConversationMessage[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!body.userMessage || typeof body.userMessage !== "string") {
    return NextResponse.json(
      { error: "userMessage is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Load or use conversation history
  // ---------------------------------------------------------------------------

  let conversationHistory: AgentConversationMessage[] = [];
  let existingConversationId: string | undefined;

  if (body.messages && Array.isArray(body.messages)) {
    // Stateless mode: caller manages state
    conversationHistory = body.messages.slice(-MAX_HISTORY_MESSAGES);
  } else {
    // Stateful mode: load from channel_conversations
    // Select includes 'status' added by 20260315_portal_upgrade migration
    const { data: existingRow } = await supabase
      .from("channel_conversations")
      .select("id, messages")
      .eq("channel_id", channel.id)
      .eq("session_id", body.sessionId)
      .single();

    // Cast to include status column (added via migration, not yet in generated types)
    const existing = existingRow as typeof existingRow & { status?: string } | null;

    if (existing) {
      existingConversationId = existing.id;

      // -----------------------------------------------------------------------
      // 6b. Human-in-the-loop status gate
      // -----------------------------------------------------------------------
      const convStatus = existing.status ?? "active";

      if (convStatus === "paused") {
        return NextResponse.json(
          { error: "conversation_paused", message: "This conversation is currently paused." },
          { status: 423, headers: corsHeaders }
        );
      }

      if (convStatus === "human_takeover") {
        // Save the user message but don't run AI — a human will respond
        const existingMessages = (existing.messages as unknown as AgentConversationMessage[]) ?? [];
        const updatedMessages = [
          ...existingMessages,
          { role: "user" as const, content: body.userMessage, timestamp: new Date().toISOString() },
        ] as unknown as Json;
        await supabase
          .from("channel_conversations")
          .update({ messages: updatedMessages })
          .eq("id", existing.id);

        return NextResponse.json(
          { status: "human_takeover", message: "A team member will respond shortly." },
          { headers: corsHeaders }
        );
      }

      if (convStatus === "closed") {
        return NextResponse.json(
          { error: "conversation_closed", message: "This conversation has been closed." },
          { status: 410, headers: corsHeaders }
        );
      }

      conversationHistory = (
        (existing.messages as unknown as AgentConversationMessage[]) ?? []
      ).slice(-MAX_HISTORY_MESSAGES);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Run the agent chat
  // ---------------------------------------------------------------------------

  logger.info("Channel chat request", {
    channelId: channel.id,
    agentId,
    sessionId: body.sessionId,
    channelType: channel.channel_type,
  });

  return runAgentChat({
    agentId,
    userMessage: body.userMessage,
    conversationHistory,
    supabase,
    composioUserId: channel.user_id,
    extraHeaders: corsHeaders,
    onConversationSave: async ({ updatedHistory }) => {
      const messagesJson = updatedHistory as unknown as Json;
      if (existingConversationId) {
        await supabase
          .from("channel_conversations")
          .update({ messages: messagesJson })
          .eq("id", existingConversationId);
        return existingConversationId;
      } else {
        const { data: newConv } = await supabase
          .from("channel_conversations")
          .insert({
            channel_id: channel.id,
            agent_id: agentId,
            session_id: body.sessionId!,
            messages: messagesJson,
          })
          .select("id")
          .single();
        return newConv?.id;
      }
    },
  });
}

// ---------------------------------------------------------------------------
// CORS preflight
// ---------------------------------------------------------------------------

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
