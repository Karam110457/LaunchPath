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
  mediaId?: string; // Meta media ID for audio/image/video/document
  mimeType?: string; // MIME type of media attachment
}

interface SendMessageResult {
  messageId: string;
}

// Template types (Meta Graph API)
export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  buttons?: TemplateButton[];
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
}

export interface TemplateButton {
  type: "PHONE_NUMBER" | "URL" | "QUICK_REPLY";
  text: string;
  phone_number?: string;
  url?: string;
  example?: string[];
}

export interface MetaTemplate {
  id: string;
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED" | "DISABLED";
  components: TemplateComponent[];
  quality_score?: { score: string };
  rejected_reason?: string;
}

export interface ParsedStatusUpdate {
  messageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
  errorCode?: string;
  errorTitle?: string;
  recipientPhone?: string;
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
  // Returns the first message for backward compatibility.
  // Use parseAllInboundMessages() to handle multiple messages per payload.
  const all = parseAllInboundMessages(body);
  return all.length > 0 ? all[0] : null;
}

/**
 * Parse ALL inbound messages from a webhook payload.
 * Meta can batch multiple messages in a single POST.
 */
export function parseAllInboundMessages(
  body: Record<string, unknown>
): ParsedWhatsAppMessage[] {
  const results: ParsedWhatsAppMessage[] = [];
  try {
    const entries = body.entry as Array<Record<string, unknown>>;
    if (!entries) return results;

    for (const entry of entries) {
      const changes = entry.changes as Array<Record<string, unknown>>;
      if (!changes) continue;

      for (const change of changes) {
        const value = change.value as Record<string, unknown>;
        if (!value) continue;

        // Skip status-only payloads
        if (value.statuses) continue;

        const messages = value.messages as Array<Record<string, unknown>>;
        if (!messages || messages.length === 0) continue;

        const metadata = value.metadata as Record<string, unknown>;
        const contacts = value.contacts as Array<Record<string, unknown>>;

        for (const msg of messages) {
          const type = mapMessageType(msg.type as string);

          let text: string | undefined;
          if (type === "text") {
            const textObj = msg.text as Record<string, unknown>;
            text = textObj?.body as string;
          }

          let mediaId: string | undefined;
          let mimeType: string | undefined;
          const mediaTypes = ["audio", "image", "video", "document"];
          if (mediaTypes.includes(type)) {
            const mediaObj = msg[type] as Record<string, unknown> | undefined;
            if (mediaObj) {
              mediaId = mediaObj.id as string | undefined;
              mimeType = mediaObj.mime_type as string | undefined;
            }
          }

          results.push({
            messageId: msg.id as string,
            from: msg.from as string,
            timestamp: parseInt(msg.timestamp as string, 10),
            type,
            text,
            phoneNumberId: metadata?.phone_number_id as string,
            displayName: (contacts?.[0]?.profile as Record<string, unknown>)
              ?.name as string | undefined,
            mediaId,
            mimeType,
          });
        }
      }
    }
  } catch {
    // Return whatever we parsed so far
  }
  return results;
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

// ---------------------------------------------------------------------------
// Template management (Meta Graph API)
// ---------------------------------------------------------------------------

/** Sync all templates from Meta WABA. Handles cursor pagination. */
export async function syncTemplatesFromMeta(params: {
  businessAccountId: string;
  accessToken: string;
}): Promise<MetaTemplate[]> {
  const { businessAccountId, accessToken } = params;
  const templates: MetaTemplate[] = [];
  let url: string | null =
    `${GRAPH_API_BASE}/${businessAccountId}/message_templates?limit=100&fields=id,name,language,category,status,components,quality_score,rejected_reason`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Template sync failed (${res.status}): ${JSON.stringify(err)}`
      );
    }

    const data: { data?: MetaTemplate[]; paging?: { next?: string } } = await res.json();
    templates.push(...(data.data ?? []));
    url = data.paging?.next ?? null;
  }

  return templates;
}

/** Submit a new template to Meta for approval. */
export async function submitTemplateToMeta(params: {
  businessAccountId: string;
  accessToken: string;
  template: {
    name: string;
    language: string;
    category: string;
    components: TemplateComponent[];
  };
}): Promise<{ id: string }> {
  const { businessAccountId, accessToken, template } = params;

  const res = await fetch(
    `${GRAPH_API_BASE}/${businessAccountId}/message_templates`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Template submit failed (${res.status}): ${JSON.stringify(err)}`
    );
  }

  const data = await res.json();
  return { id: data.id };
}

/** Delete a template from Meta by name. */
export async function deleteTemplateFromMeta(params: {
  businessAccountId: string;
  accessToken: string;
  templateName: string;
}): Promise<void> {
  const { businessAccountId, accessToken, templateName } = params;

  const res = await fetch(
    `${GRAPH_API_BASE}/${businessAccountId}/message_templates?name=${encodeURIComponent(templateName)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Template delete failed (${res.status}): ${JSON.stringify(err)}`
    );
  }
}

/** Send a template message to a WhatsApp user. */
export async function sendTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  language: string;
  components?: Record<string, unknown>[];
}): Promise<SendMessageResult> {
  const { phoneNumberId, accessToken, to, templateName, language, components } =
    params;

  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        ...(components?.length ? { components } : {}),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Template send failed (${res.status}): ${JSON.stringify(err)}`
    );
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? "unknown" };
}

// ---------------------------------------------------------------------------
// Parse status updates from webhook
// ---------------------------------------------------------------------------

/** Parse a status update (sent/delivered/read/failed) from the webhook payload. */
export function parseStatusUpdate(
  body: Record<string, unknown>
): ParsedStatusUpdate | null {
  // Returns first status for backward compatibility.
  // Use parseAllStatusUpdates() to handle multiple statuses per payload.
  const all = parseAllStatusUpdates(body);
  return all.length > 0 ? all[0] : null;
}

/**
 * Parse ALL status updates from a webhook payload.
 * Meta can batch multiple statuses in a single POST.
 */
export function parseAllStatusUpdates(
  body: Record<string, unknown>
): ParsedStatusUpdate[] {
  const results: ParsedStatusUpdate[] = [];
  try {
    const entries = body.entry as Array<Record<string, unknown>>;
    if (!entries) return results;

    for (const entry of entries) {
      const changes = entry.changes as Array<Record<string, unknown>>;
      if (!changes) continue;

      for (const change of changes) {
        const value = change.value as Record<string, unknown>;
        if (!value) continue;

        const statuses = value.statuses as Array<Record<string, unknown>>;
        if (!statuses || statuses.length === 0) continue;

        for (const s of statuses) {
          const rawStatus = s.status as string;
          let status: ParsedStatusUpdate["status"];
          switch (rawStatus) {
            case "sent": status = "sent"; break;
            case "delivered": status = "delivered"; break;
            case "read": status = "read"; break;
            case "failed": status = "failed"; break;
            default: continue;
          }

          const errors = s.errors as Array<Record<string, unknown>> | undefined;
          results.push({
            messageId: s.id as string,
            status,
            timestamp: parseInt(s.timestamp as string, 10),
            recipientPhone: s.recipient_id as string | undefined,
            errorCode: errors?.[0]?.code as string | undefined,
            errorTitle: errors?.[0]?.title as string | undefined,
          });
        }
      }
    }
  } catch {
    // Return whatever we parsed so far
  }
  return results;
}
