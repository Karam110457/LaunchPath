/**
 * Event dispatcher — fire HMAC-signed webhook events to subscribed URLs.
 */

import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a hostname resolves to a private/internal address.
 * Blocks: localhost, 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x,
 * [::1], fc00::/7, metadata endpoints, .local, .internal TLDs.
 */
function isPrivateHost(hostname: string): boolean {
  // Exact matches
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname === "::1"
  ) return true;

  // Block internal/reserved TLDs
  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost")
  ) return true;

  // Cloud metadata endpoints
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") return true;

  // IP address range checks
  const parts = hostname.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const octets = parts.map(Number);
    const [a, b] = octets;
    // 127.0.0.0/8
    if (a === 127) return true;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
  }

  // IPv6 private ranges (fc00::/7, fe80::/10)
  if (hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80")) return true;

  return false;
}

export type EventType =
  | "whatsapp.message.received"
  | "whatsapp.conversation.completed"
  | "whatsapp.contact.tagged"
  | "whatsapp.sequence.replied"
  | "whatsapp.sequence.completed";

/**
 * Dispatch an event to all matching subscriptions.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function dispatchEvent(
  supabase: SupabaseClient,
  params: {
    channelId: string;
    eventType: EventType;
    payload: Record<string, unknown>;
  }
): Promise<void> {
  const { channelId, eventType, payload } = params;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions } = await (supabase.from as any)("event_subscriptions")
      .select("id, webhook_url, secret")
      .eq("channel_id", channelId)
      .eq("event_type", eventType)
      .eq("is_enabled", true);

    if (!subscriptions || subscriptions.length === 0) return;

    const eventPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const body = JSON.stringify(eventPayload);

    for (const sub of subscriptions as { id: string; webhook_url: string; secret: string | null }[]) {
      // Validate URL is not internal (SSRF prevention)
      try {
        const url = new URL(sub.webhook_url);
        if (url.protocol !== "https:") continue; // Require HTTPS
        const hostname = url.hostname.toLowerCase();
        if (isPrivateHost(hostname)) continue;
      } catch {
        continue;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // HMAC signature if secret is configured
      if (sub.secret) {
        const signature = createHmac("sha256", sub.secret)
          .update(body)
          .digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${signature}`;
      }

      // Fire-and-forget
      fetch(sub.webhook_url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      }).catch(() => {
        // Best effort — don't fail the main flow
      });
    }
  } catch {
    // Don't let event dispatching errors affect the main flow
  }
}
