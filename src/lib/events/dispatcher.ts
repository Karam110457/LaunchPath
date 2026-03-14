/**
 * Event dispatcher — fire HMAC-signed webhook events to subscribed URLs.
 */

import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

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
      // Validate URL is not internal (basic SSRF prevention)
      try {
        const url = new URL(sub.webhook_url);
        const hostname = url.hostname.toLowerCase();
        if (
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname === "0.0.0.0" ||
          hostname.endsWith(".internal") ||
          hostname === "metadata.google.internal" ||
          hostname === "169.254.169.254"
        ) {
          continue;
        }
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
