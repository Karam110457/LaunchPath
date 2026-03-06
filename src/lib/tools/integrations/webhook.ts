import { tool } from "ai";
import { z } from "zod";
import { createHmac } from "crypto";
import { logger } from "@/lib/security/logger";
import { isBlockedUrl } from "../ssrf";
import type { WebhookConfig } from "../types";

const WEBHOOK_TIMEOUT_MS = 15_000;

/**
 * Derive a stable Claude tool name from a webhook's display name.
 * Exported so the chat route can build the display-name map using
 * the same logic without duplicating it.
 */
export function makeWebhookToolKey(displayName: string): string {
  return (
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "send_webhook"
  );
}

export function buildWebhookTool(
  config: WebhookConfig,
  displayName: string,
  description: string
) {
  const toolName = makeWebhookToolKey(displayName);

  return {
    // Vercel AI SDK requires a stable name — we wrap it in an object keyed by toolName
    toolName,
    toolDef: tool({
      description,
      inputSchema: z.object({
        data: z
          .record(z.string(), z.unknown())
          .describe("Data to send to the webhook. Include any relevant fields from the conversation."),
      }),
      execute: async (params) => {
        // Security: block internal network requests
        if (isBlockedUrl(config.url)) {
          return { success: false, message: "Requests to internal network addresses are not allowed." };
        }

        // Metadata first, then user data spread (user data can override metadata)
        const payload = {
          source: "launchpath-agent",
          timestamp: new Date().toISOString(),
          ...(params.data as Record<string, unknown>),
        };

        const body = JSON.stringify(payload);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (config.secret) {
          const sig = createHmac("sha256", config.secret)
            .update(body)
            .digest("hex");
          headers["X-Webhook-Signature"] = `sha256=${sig}`;
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

          const res = await fetch(config.url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            return { success: true, message: "Data sent successfully." };
          }
          logger.error("Webhook returned error", { status: res.status, url: config.url });
          return { success: false, message: `Webhook returned HTTP ${res.status}.` };
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return { success: false, message: `Webhook timed out after ${WEBHOOK_TIMEOUT_MS / 1000}s.` };
          }
          logger.error("Webhook execution error", { err, url: config.url });
          return { success: false, message: "Could not reach the webhook endpoint." };
        }
      },
    }),
  };
}
