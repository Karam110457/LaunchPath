/**
 * WhatsApp Cloud API client utilities.
 *
 * Handles:
 * - Sending text messages via the Graph API
 * - Sending read receipts
 * - Verifying Meta webhook signatures
 * - Parsing inbound webhook payloads
 * - 24-hour session window checking
 */

import { createHmac, timingSafeEqual } from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v25.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedWhatsAppMessage {
  messageId: string;
  from: string; // sender phone (E.164)
  timestamp: number;
  type: "text" | "image" | "audio" | "video" | "document" | "location" | "interactive" | "contacts" | "unknown";
  text?: string;
  phoneNumberId: string; // which business number received it
  displayName?: string; // WhatsApp profile name
}

interface SendMessageResult {
  messageId: string;
}

// ---------------------------------------------------------------------------
// Outbound: send text message
// ---------------------------------------------------------------------------

export async function sendWhatsAppMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}): Promise<SendMessageResult> {
  const { phoneNumberId, accessToken, to, text } = params;

  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp send failed (${res.status}): ${JSON.stringify(err)}`
    );
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? "unknown" };
}

// ---------------------------------------------------------------------------
// Outbound: mark message as read
// ---------------------------------------------------------------------------

export async function markMessageRead(params: {
  phoneNumberId: string;
  accessToken: string;
  messageId: string;
}): Promise<void> {
  const { phoneNumberId, accessToken, messageId } = params;

  await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

export function verifyWebhookSignature(params: {
  rawBody: string | Buffer;
  signature: string;
  appSecret: string;
}): boolean {
  const { rawBody, signature, appSecret } = params;

  // Header format: "sha256=<hex>"
  const expected = signature.replace("sha256=", "");
  if (!expected) return false;

  const hmac = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Parse inbound webhook payload
// ---------------------------------------------------------------------------

export function parseInboundMessage(
  body: Record<string, unknown>
): ParsedWhatsAppMessage | null {
  try {
    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    if (!entry) return null;

    const changes = (entry.changes as Array<Record<string, unknown>>)?.[0];
    if (!changes) return null;

    const value = changes.value as Record<string, unknown>;
    if (!value) return null;

    // Status updates (sent/delivered/read) — not a message
    if (value.statuses) return null;

    const messages = value.messages as Array<Record<string, unknown>>;
    if (!messages || messages.length === 0) return null;

    const msg = messages[0];
    const metadata = value.metadata as Record<string, unknown>;
    const contacts = value.contacts as Array<Record<string, unknown>>;

    const type = mapMessageType(msg.type as string);

    let text: string | undefined;
    if (type === "text") {
      const textObj = msg.text as Record<string, unknown>;
      text = textObj?.body as string;
    }

    return {
      messageId: msg.id as string,
      from: msg.from as string,
      timestamp: parseInt(msg.timestamp as string, 10),
      type,
      text,
      phoneNumberId: metadata?.phone_number_id as string,
      displayName: (contacts?.[0]?.profile as Record<string, unknown>)
        ?.name as string | undefined,
    };
  } catch {
    return null;
  }
}

function mapMessageType(
  raw: string
): ParsedWhatsAppMessage["type"] {
  switch (raw) {
    case "text":
      return "text";
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "video":
      return "video";
    case "document":
      return "document";
    case "location":
      return "location";
    case "interactive":
      return "interactive";
    case "contacts":
      return "contacts";
    default:
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// 24-hour session window
// ---------------------------------------------------------------------------

const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Check if the 24-hour reply window is still open. */
export function isSessionWindowOpen(
  lastCustomerMessageAt: string | null | undefined
): boolean {
  if (!lastCustomerMessageAt) return false;
  return Date.now() - new Date(lastCustomerMessageAt).getTime() < SESSION_WINDOW_MS;
}
