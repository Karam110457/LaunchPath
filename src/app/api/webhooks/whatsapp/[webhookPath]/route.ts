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
import { isOptOutKeyword, handleOptOut } from "@/lib/channels/opt-out";
import { downloadWhatsAppMedia, transcribeAudio, describeImage } from "@/lib/channels/media";
import { isWithinBusinessHours } from "@/lib/channels/business-hours";
import { stopSequencesOnReply } from "@/lib/sequences/triggers";
import { buildTagContactTool, TAG_TOOL_SYSTEM_PROMPT } from "@/lib/tools/integrations/system-tools";
import { dispatchEvent } from "@/lib/events/dispatcher";
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
        // Also update message_statuses in channel_conversations metadata
        // so the portal UI can show delivery ticks
        if (statusUpdate.recipientPhone) {
          const { data: conv } = await supabase
            .from("channel_conversations")
            .select("id, metadata")
            .eq("session_id", statusUpdate.recipientPhone)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();

          if (conv) {
            const meta = (conv.metadata ?? {}) as Record<string, unknown>;
            const statuses = (meta.message_statuses ?? {}) as Record<string, string>;
            statuses[statusUpdate.messageId] = statusUpdate.status;
            await supabase
              .from("channel_conversations")
              .update({
                metadata: { ...meta, message_statuses: statuses } as unknown as Json,
              })
              .eq("id", conv.id);
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

  // Look up client_id for credit cap enforcement
  let clientId: string | undefined;
  if (channel.campaign_id) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("client_id")
      .eq("id", channel.campaign_id)
      .single();
    clientId = (campaign as { client_id?: string } | null)?.client_id ?? undefined;
  }

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
        clientId,
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
  clientId?: string;
}) {
  const { supabase, channel, config, parsed, clientId } = ctx;

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
  // 2. Opt-out handling
  // -------------------------------------------------------------------------
  if (isOptOutKeyword(parsed.text)) {
    await handleOptOut({
      supabase,
      channelId: channel.id,
      phone: parsed.from,
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
    });
    return;
  }

  // -------------------------------------------------------------------------
  // 3. Handle non-text messages (voice notes, images, or unsupported)
  // -------------------------------------------------------------------------
  if (parsed.type !== "text" || !parsed.text) {
    // Voice note transcription
    if (parsed.type === "audio" && parsed.mediaId && config.voiceNotes?.transcriptionEnabled) {
      try {
        const media = await downloadWhatsAppMedia({
          mediaId: parsed.mediaId,
          accessToken: config.accessToken,
        });
        const { text } = await transcribeAudio(media.buffer, media.mimeType);
        parsed.text = `[Voice note]: ${text}`;
        // Fall through to normal processing
      } catch (err) {
        logger.error("Voice note transcription failed", {
          channelId: channel.id,
          error: err instanceof Error ? err.message : String(err),
        });
        await sendWhatsAppMessage({
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
          to: parsed.from,
          text: "Sorry, I couldn't process your voice message. Could you please type your question instead?",
        });
        return;
      }
    }
    // Image description via vision
    else if (parsed.type === "image" && parsed.mediaId && config.imageHandling?.visionEnabled) {
      try {
        const media = await downloadWhatsAppMedia({
          mediaId: parsed.mediaId,
          accessToken: config.accessToken,
        });
        const description = await describeImage(media.buffer, media.mimeType);
        parsed.text = `[Image received]: ${description}`;
        // Fall through to normal processing
      } catch (err) {
        logger.error("Image description failed", {
          channelId: channel.id,
          error: err instanceof Error ? err.message : String(err),
        });
        await sendWhatsAppMessage({
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
          to: parsed.from,
          text: "Sorry, I couldn't process your image. Could you please describe what you're asking about?",
        });
        return;
      }
    }
    // Unsupported media type
    else if (!parsed.text) {
      await sendWhatsAppMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: parsed.from,
        text: "Thanks for your message! I can currently only process text messages. Please send your question as text and I'll be happy to help.",
      });
      return;
    }
  }

  // -------------------------------------------------------------------------
  // 4. Business hours check
  // -------------------------------------------------------------------------
  if (config.businessHours?.enabled && !isWithinBusinessHours(config.businessHours)) {
    const behavior = config.businessHours.outsideHoursBehavior;
    if (behavior === "away_message" && config.businessHours.awayMessage) {
      await sendWhatsAppMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: parsed.from,
        text: config.businessHours.awayMessage,
      });
    }
    // For both 'queue' and 'away_message': save the user message to conversation but don't run AI
    // Load/create conversation to persist the message
    const sessionId = parsed.from;
    const { data: existingRow } = await supabase
      .from("channel_conversations")
      .select("id, messages")
      .eq("channel_id", channel.id)
      .eq("session_id", sessionId)
      .single();

    const userMsg = { role: "user" as const, content: parsed.text!, timestamp: new Date().toISOString() };
    if (existingRow) {
      const msgs = ((existingRow.messages as unknown as AgentConversationMessage[]) ?? []);
      await supabase
        .from("channel_conversations")
        .update({ messages: [...msgs, userMsg] as unknown as Json })
        .eq("id", existingRow.id);
    } else {
      await supabase
        .from("channel_conversations")
        .insert({
          channel_id: channel.id,
          agent_id: channel.agent_id,
          session_id: sessionId,
          messages: [userMsg] as unknown as Json,
          metadata: {
            last_customer_message_at: new Date().toISOString(),
            whatsapp_profile_name: parsed.displayName,
            whatsapp_phone: parsed.from,
          },
        });
    }
    return;
  }

  // -------------------------------------------------------------------------
  // 5. Load or create conversation (session_id = phone number)
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
  // 5. Response delay is computed after agent reply (humanisation)
  // -------------------------------------------------------------------------
  const baseDelayMs = config.responseDelay ?? 0;

  // -------------------------------------------------------------------------
  // 6. Run agent and send reply
  // -------------------------------------------------------------------------
  let assistantReply = "";

  // Build system tools for WhatsApp agent
  const systemTools = buildTagContactTool({
    supabase,
    channelId: channel.id,
    phone: parsed.from,
  });

  const response = await runAgentChat({
    agentId: channel.agent_id,
    userMessage: parsed.text!,
    conversationHistory,
    supabase,
    composioUserId: channel.user_id,
    clientId,
    additionalTools: systemTools,
    additionalSystemPrompt: TAG_TOOL_SYSTEM_PROMPT,

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
  if (response.ok && response.body) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
  } else if (!response.ok) {
    // Agent call failed (402 insufficient credits, 429 rate limit, 404 agent not found, etc.)
    logger.error("Agent chat failed for WhatsApp message", {
      channelId: channel.id,
      status: response.status,
      from: parsed.from,
    });
    // Don't leave the customer without a response — send a generic error message
    // within the 24h window
    try {
      await sendWhatsAppMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: parsed.from,
        text: "Sorry, I'm temporarily unable to respond. Please try again later.",
      });
    } catch {
      // Best-effort — don't fail the webhook
    }
  }

  // -------------------------------------------------------------------------
  // 7. Send reply via WhatsApp (with optional delay)
  // -------------------------------------------------------------------------
  if (assistantReply) {
    // Scale delay with response length for human-like pacing
    // baseDelay + min(length * 5ms, 3000ms), capped at 8s total
    const scaledDelay = baseDelayMs > 0
      ? Math.min(baseDelayMs + Math.min(assistantReply.length * 5, 3000), 8000)
      : 0;
    if (scaledDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, scaledDelay));
    }

    // Check 24-hour window (should always be open since customer just messaged)
    const windowOpen = isSessionWindowOpen(now);
    if (windowOpen) {
      const sendResult = await sendWhatsAppMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: parsed.from,
        text: assistantReply,
      });

      // Store outbound messageId in conversation metadata for delivery tick tracking
      if (sendResult.messageId && existingConversationId) {
        const { data: convForMeta } = await supabase
          .from("channel_conversations")
          .select("metadata")
          .eq("id", existingConversationId)
          .single();
        if (convForMeta) {
          const meta = (convForMeta.metadata ?? {}) as Record<string, unknown>;
          const statuses = (meta.message_statuses ?? {}) as Record<string, string>;
          statuses[sendResult.messageId] = "sent";
          const outboundIds = ((meta.outbound_message_ids ?? []) as string[]);
          outboundIds.push(sendResult.messageId);
          await supabase
            .from("channel_conversations")
            .update({
              metadata: {
                ...meta,
                message_statuses: statuses,
                outbound_message_ids: outboundIds,
              } as unknown as Json,
            })
            .eq("id", existingConversationId);
        }
      }
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
  // 8. Stop sequences on reply
  // -------------------------------------------------------------------------
  await stopSequencesOnReply(supabase, channel.id, parsed.from).catch(() => {
    // Non-critical
  });

  // -------------------------------------------------------------------------
  // 9. Upsert contact record
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

  // -------------------------------------------------------------------------
  // 10. Dispatch webhook event
  // -------------------------------------------------------------------------
  dispatchEvent(supabase, {
    channelId: channel.id,
    eventType: "whatsapp.message.received",
    payload: {
      from: parsed.from,
      displayName: parsed.displayName,
      messageType: parsed.type,
      text: parsed.text?.slice(0, 500),
      conversationId: existingConversationId,
    },
  }).catch(() => {});
}
