import { tool } from "ai";
import { z } from "zod";
import { createHmac } from "crypto";
import { logger } from "@/lib/security/logger";
import type { WebhookConfig } from "../types";

export function buildWebhookTool(
  config: WebhookConfig,
  displayName: string,
  description: string
) {
  // Convert display name to a valid Claude tool name (snake_case, no spaces)
  const toolName = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60) || "send_webhook";

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
        const payload = {
          ...(params.data as Record<string, unknown>),
          source: "launchpath-agent",
          timestamp: new Date().toISOString(),
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
          const res = await fetch(config.url, {
            method: "POST",
            headers,
            body,
          });

          if (res.ok || res.status < 500) {
            return { success: true, message: "Data sent successfully." };
          }
          logger.error("Webhook returned error", { status: res.status, url: config.url });
          return { success: false, message: `Webhook returned HTTP ${res.status}.` };
        } catch (err) {
          logger.error("Webhook execution error", { err, url: config.url });
          return { success: false, message: "Could not reach the webhook endpoint." };
        }
      },
    }),
  };
}
