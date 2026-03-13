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
      "id, agent_id, user_id, channel_type, allowed_origins, rate_limit_rpm, is_enabled, config"
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
    visitorInfo?: { name?: string; email?: string };
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
    // 'status' column added by migration, not in generated types yet — use '*' and cast
    const { data: existingRow } = await supabase
      .from("channel_conversations")
      .select("*")
      .eq("channel_id", channel.id)
      .eq("session_id", body.sessionId)
      .single();

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
          { error: "human_takeover", message: "A team member will respond shortly." },
          { status: 423, headers: corsHeaders }
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
  // 6c. Store visitor info in conversation metadata (from pre-chat form)
  // ---------------------------------------------------------------------------

  if (body.visitorInfo && existingConversationId) {
    const { data: convRow } = await supabase
      .from("channel_conversations")
      .select("metadata")
      .eq("id", existingConversationId)
      .single();
    const existingMeta = ((convRow?.metadata ?? {}) as Record<string, unknown>);
    if (!existingMeta.visitor_name && !existingMeta.visitor_email) {
      await supabase
        .from("channel_conversations")
        .update({
          metadata: {
            ...existingMeta,
            visitor_name: body.visitorInfo.name || null,
            visitor_email: body.visitorInfo.email || null,
          },
        })
        .eq("id", existingConversationId);
    }
  }

  // ---------------------------------------------------------------------------
  // 6d. Auto-escalation detection (gated by config toggle)
  // ---------------------------------------------------------------------------

  const widgetConfig = (channel.config ?? {}) as Record<string, unknown>;
  const autoEscalationConfig = widgetConfig.autoEscalation as { enabled?: boolean; keywords?: string[] } | undefined;
  const autoEscalationEnabled = autoEscalationConfig?.enabled !== false; // default: on

  let wantsHuman = false;
  let isLooping = false;

  if (autoEscalationEnabled) {
    const defaultKeywords = [
      "talk to a human", "speak to someone", "speak to a human",
      "talk to a person", "agent please", "real person",
      "human agent", "transfer me", "speak with someone",
      "let me talk to", "connect me to", "i want a human",
    ];
    const escalationKeywords = autoEscalationConfig?.keywords?.length
      ? autoEscalationConfig.keywords
      : defaultKeywords;

    const messageLower = body.userMessage.toLowerCase();
    wantsHuman = escalationKeywords.some((kw) => messageLower.includes(kw));

    // Loop detection: same message sent 3+ times
    const recentUserMessages = conversationHistory
      .filter((m) => m.role === "user")
      .slice(-5)
      .map((m) => m.content.toLowerCase().trim());
    const currentMsg = body.userMessage.toLowerCase().trim();
    const repeatCount = recentUserMessages.filter((m) => m === currentMsg).length;
    isLooping = repeatCount >= 2; // Current + 2 previous = 3 total
  }

  if ((wantsHuman || isLooping) && existingConversationId) {
    // Auto-escalate to human_takeover
    await supabase
      .from("channel_conversations")
      .update({
        status: "human_takeover",
        metadata: {
          ...((await supabase
            .from("channel_conversations")
            .select("metadata")
            .eq("id", existingConversationId)
            .single()).data?.metadata ?? {}) as Record<string, unknown>,
          escalation_reason: wantsHuman ? "explicit_request" : "loop_detected",
          escalated_at: new Date().toISOString(),
        },
      })
      .eq("id", existingConversationId);

    // Save user message + escalation notice
    const escalationMsg = wantsHuman
      ? "I'm connecting you with a team member. They'll have the full context of our conversation."
      : "It seems like you might need more help. I'm connecting you with a team member.";

    const existingMessages = conversationHistory as unknown as Array<Record<string, unknown>>;
    const updatedMessages = [
      ...existingMessages,
      { role: "user", content: body.userMessage, timestamp: new Date().toISOString() },
      { role: "assistant", content: escalationMsg, timestamp: new Date().toISOString() },
    ] as unknown as Json;

    await supabase
      .from("channel_conversations")
      .update({ messages: updatedMessages })
      .eq("id", existingConversationId);

    return NextResponse.json(
      { error: "human_takeover", message: escalationMsg },
      { status: 423, headers: corsHeaders }
    );
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
        const metadata = body.visitorInfo
          ? {
              visitor_name: body.visitorInfo.name || null,
              visitor_email: body.visitorInfo.email || null,
            }
          : undefined;
        const { data: newConv } = await supabase
          .from("channel_conversations")
          .insert({
            channel_id: channel.id,
            agent_id: agentId,
            session_id: body.sessionId!,
            messages: messagesJson,
            ...(metadata ? { metadata: metadata as unknown as Json } : {}),
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
