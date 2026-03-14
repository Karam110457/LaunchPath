/**
 * WhatsApp Webhook — Meta pushes inbound messages and status updates here.
 *
 * GET  — Meta verification challenge (subscribe handshake)
 * POST — Inbound messages + delivery status updates
 *
 * Auth: None (public endpoint). Security via:
 *   - webhookPath lookup (random, non-guessable)
 *   - X-Hub-Signature-256 HMAC verification (META_APP_SECRET)
 */

import { NextRequest } from "next/server";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/security/logger";
import {
  verifyWebhookSignature,
  parseInboundMessage,
  parseStatusUpdate,
  sendWhatsAppMessage,
  sendTemplateMessage,
  markMessageRead,
  isSessionWindowOpen,
} from "@/lib/channels/whatsapp";
import type { WhatsAppConfig } from "@/lib/channels/types";
import { runAgentChat } from "@/lib/chat/run-agent-chat";
import type { AgentConversationMessage } from "@/lib/chat/agent-chat-types";
import type { Json } from "@/types/database";

const MAX_HISTORY_MESSAGES = 30;

// ---------------------------------------------------------------------------
// GET — Meta verification challenge
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookPath: string }> }
) {
  const { webhookPath } = await params;
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("Missing parameters", { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id, config")
    .eq("webhook_path", webhookPath)
    .eq("channel_type", "whatsapp")
    .single();

  if (!channel) {
    return new Response("Not found", { status: 404 });
  }

  const config = channel.config as unknown as WhatsAppConfig;
  if (token === config.verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Inbound messages + status updates
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookPath: string }> }
) {
  const { webhookPath } = await params;

  // -------------------------------------------------------------------------
  // 1. Read raw body for signature verification
  // -------------------------------------------------------------------------
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    logger.error("META_APP_SECRET not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  if (!verifyWebhookSignature({ rawBody, signature, appSecret })) {
    logger.warn("WhatsApp webhook signature verification failed", { webhookPath });
    return new Response("Invalid signature", { status: 403 });
  }

  // -------------------------------------------------------------------------
  // 2. Parse payload
  // -------------------------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = parseInboundMessage(body);
  const statusUpdate = !parsed ? parseStatusUpdate(body) : null;

  // Neither a message nor a status update — acknowledge and exit
  if (!parsed && !statusUpdate) {
    return new Response("OK", { status: 200 });
  }

  // -------------------------------------------------------------------------
  // 3. Handle delivery status updates (sent/delivered/read/failed)
  // -------------------------------------------------------------------------
  if (statusUpdate && !parsed) {
    const supabase = createServiceClient();

    after(async () => {
      try {
        // Update template_send_messages status
        const statusMap: Record<string, Record<string, unknown>> = {
          sent: { status: "sent", sent_at: new Date(statusUpdate.timestamp * 1000).toISOString() },
          delivered: { status: "delivered", delivered_at: new Date(statusUpdate.timestamp * 1000).toISOString() },
          read: { status: "read", read_at: new Date(statusUpdate.timestamp * 1000).toISOString() },
          failed: {
            status: "failed",
            error_code: statusUpdate.errorCode ?? null,
            error_message: statusUpdate.errorTitle ?? null,
          },
        };

        const updates = statusMap[statusUpdate.status];
        if (!updates) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: msg } = await (supabase.from as any)("template_send_messages")
          .update(updates)
          .eq("whatsapp_message_id", statusUpdate.messageId)
          .select("job_id")
          .single();

        // Increment job counter
        if (msg?.job_id) {
          const counterField =
            statusUpdate.status === "delivered"
              ? "delivered_count"
              : statusUpdate.status === "read"
                ? "read_count"
                : statusUpdate.status === "failed"
                  ? "failed_count"
                  : null;

          if (counterField) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: job } = await (supabase.from as any)("template_send_jobs")
              .select(counterField)
              .eq("id", msg.job_id)
              .single();

            if (job) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from as any)("template_send_jobs")
                .update({
                  [counterField]: (job[counterField] ?? 0) + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", msg.job_id);
            }
          }
        }
      } catch (err) {
        logger.error("Status update processing failed", {
          messageId: statusUpdate.messageId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    return new Response("OK", { status: 200 });
  }

  // At this point we have a parsed inbound message
  if (!parsed) {
    return new Response("OK", { status: 200 });
  }

  // -------------------------------------------------------------------------
  // 4. Look up channel
  // -------------------------------------------------------------------------
  const supabase = createServiceClient();
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id, agent_id, user_id, config, is_enabled, campaign_id")
    .eq("webhook_path", webhookPath)
    .eq("channel_type", "whatsapp")
    .single();

  if (!channel || !channel.is_enabled) {
    return new Response("OK", { status: 200 });
  }

  const config = channel.config as unknown as WhatsAppConfig;

  // -------------------------------------------------------------------------
  // 4. Return 200 immediately — process in background via after()
  // -------------------------------------------------------------------------

  after(async () => {
    try {
      await processInboundMessage({
        supabase,
        channel,
        config,
        parsed,
      });
    } catch (err) {
      logger.error("WhatsApp message processing failed", {
        channelId: channel.id,
        from: parsed.from,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return new Response("OK", { status: 200 });
}

// ---------------------------------------------------------------------------
// Background message processing
// ---------------------------------------------------------------------------

async function processInboundMessage(ctx: {
  supabase: ReturnType<typeof createServiceClient>;
  channel: {
    id: string;
    agent_id: string;
    user_id: string;
    config: unknown;
    is_enabled: boolean;
    campaign_id: string | null;
  };
  config: WhatsAppConfig;
  parsed: NonNullable<ReturnType<typeof parseInboundMessage>>;
}) {
  const { supabase, channel, config, parsed } = ctx;

  // -------------------------------------------------------------------------
  // 1. Send read receipt (if configured)
  // -------------------------------------------------------------------------
  if (config.readReceipts !== false) {
    await markMessageRead({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
      messageId: parsed.messageId,
    }).catch(() => {
      // Non-critical — don't fail the whole flow
    });
  }

  // -------------------------------------------------------------------------
  // 2. Handle non-text messages (Phase 1: text only)
  // -------------------------------------------------------------------------
  if (parsed.type !== "text" || !parsed.text) {
    await sendWhatsAppMessage({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
      to: parsed.from,
      text: "Thanks for your message! I can currently only process text messages. Please send your question as text and I'll be happy to help.",
    });
    return;
  }

  // -------------------------------------------------------------------------
  // 3. Load or create conversation (session_id = phone number)
  // -------------------------------------------------------------------------
  const sessionId = parsed.from;

  const { data: existingRow } = await supabase
    .from("channel_conversations")
    .select("*")
    .eq("channel_id", channel.id)
    .eq("session_id", sessionId)
    .single();

  const existing = existingRow as typeof existingRow & { status?: string } | null;
  let existingConversationId = existing?.id;
  let conversationHistory: AgentConversationMessage[] = [];

  if (existing) {
    const convStatus = existing.status ?? "active";

    // HITL status gates (same logic as widget chat route)
    if (convStatus === "paused") {
      // Don't respond — conversation is paused
      return;
    }

    if (convStatus === "human_takeover") {
      // Save the message for the human agent but don't run AI
      const existingMessages = (existing.messages as unknown as AgentConversationMessage[]) ?? [];
      const updatedMessages = [
        ...existingMessages,
        { role: "user" as const, content: parsed.text, timestamp: new Date().toISOString() },
      ] as unknown as Json;
      await supabase
        .from("channel_conversations")
        .update({ messages: updatedMessages })
        .eq("id", existing.id);
      return;
    }

    if (convStatus === "closed") {
      // Reopen the conversation
      await supabase
        .from("channel_conversations")
        .update({ status: "active" } as Record<string, unknown>)
        .eq("id", existing.id);
    }

    conversationHistory = (
      (existing.messages as unknown as AgentConversationMessage[]) ?? []
    ).slice(-MAX_HISTORY_MESSAGES);
  }

  // -------------------------------------------------------------------------
  // 4. Update 24-hour window tracking
  // -------------------------------------------------------------------------
  const now = new Date().toISOString();
  if (existingConversationId) {
    const existingMeta = ((existing?.metadata ?? {}) as Record<string, unknown>);
    await supabase
      .from("channel_conversations")
      .update({
        metadata: {
          ...existingMeta,
          last_customer_message_at: now,
          whatsapp_profile_name: parsed.displayName ?? existingMeta.whatsapp_profile_name,
          whatsapp_phone: parsed.from,
        } as unknown as Json,
      })
      .eq("id", existingConversationId);
  }

  // -------------------------------------------------------------------------
  // 5. Apply response delay (humanisation)
  // -------------------------------------------------------------------------
  const delayMs = config.responseDelay ?? 0;

  // -------------------------------------------------------------------------
  // 6. Run agent and send reply
  // -------------------------------------------------------------------------
  let assistantReply = "";

  const response = await runAgentChat({
    agentId: channel.agent_id,
    userMessage: parsed.text,
    conversationHistory,
    supabase,
    composioUserId: channel.user_id,

    onConversationSave: async ({ updatedHistory, assistantContent, userMessage }) => {
      assistantReply = assistantContent;

      if (existingConversationId) {
        // Update existing conversation
        await supabase
          .from("channel_conversations")
          .update({
            messages: updatedHistory as unknown as Json,
          })
          .eq("id", existingConversationId);
        return existingConversationId;
      } else {
        // Create new conversation
        const { data: newConv } = await supabase
          .from("channel_conversations")
          .insert({
            channel_id: channel.id,
            agent_id: channel.agent_id,
            session_id: sessionId,
            messages: updatedHistory as unknown as Json,
            metadata: {
              last_customer_message_at: now,
              whatsapp_profile_name: parsed.displayName,
              whatsapp_phone: parsed.from,
            },
          })
          .select("id")
          .single();

        existingConversationId = newConv?.id;
        return newConv?.id;
      }
    },
  });

  // Consume the SSE stream to completion (we don't send it to a client)
  // The onConversationSave callback already captured assistantReply
  if (response.body) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
  }

  // -------------------------------------------------------------------------
  // 7. Send reply via WhatsApp (with optional delay)
  // -------------------------------------------------------------------------
  if (assistantReply) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Check 24-hour window (should always be open since customer just messaged)
    const windowOpen = isSessionWindowOpen(now);
    if (windowOpen) {
      await sendWhatsAppMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: parsed.from,
        text: assistantReply,
      });
    } else {
      logger.warn("WhatsApp session window closed, attempting template fallback", {
        channelId: channel.id,
        to: parsed.from,
      });

      // Template fallback: send a pre-configured template when 24h window is closed
      const templateFallback = (config as unknown as Record<string, unknown>).templateFallback as
        | { enabled?: boolean; templateId?: string }
        | undefined;

      if (templateFallback?.enabled && templateFallback.templateId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: fallbackTemplate } = await (supabase.from as any)("whatsapp_templates")
            .select("name, language")
            .eq("id", templateFallback.templateId)
            .eq("status", "APPROVED")
            .single();

          if (fallbackTemplate) {
            await sendTemplateMessage({
              phoneNumberId: config.phoneNumberId,
              accessToken: config.accessToken,
              to: parsed.from,
              templateName: fallbackTemplate.name,
              language: fallbackTemplate.language,
            });
          }
        } catch (fallbackErr) {
          logger.error("Template fallback send failed", {
            channelId: channel.id,
            error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 8. Upsert contact record
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("campaign_contacts")
    .upsert(
      {
        user_id: channel.user_id,
        channel_id: channel.id,
        agent_id: channel.agent_id,
        phone: parsed.from,
        name: parsed.displayName ?? null,
        profile_name: parsed.displayName ?? null,
        source: "inbound",
        last_replied_at: now,
        conversation_count: 1,
      },
      { onConflict: "channel_id,phone" }
    )
    .then(async ({ error }: { error: unknown }) => {
      if (error) {
        // If insert failed, try updating existing record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)("campaign_contacts")
          .update({
            last_replied_at: now,
            profile_name: parsed.displayName ?? null,
          })
          .eq("channel_id", channel.id)
          .eq("phone", parsed.from);
      }
    });
}
