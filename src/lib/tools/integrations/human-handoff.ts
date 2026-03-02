import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/security/logger";
import type { HumanHandoffConfig } from "../types";

export function buildHumanHandoffTool(config: HumanHandoffConfig, description: string) {
  return tool({
    description,
    inputSchema: z.object({
      reason: z
        .string()
        .describe("Why is this being escalated to a human? (e.g. 'complex billing issue', 'customer upset')"),
      conversation_summary: z
        .string()
        .describe("A concise summary of the conversation so far so the human agent has context"),
    }),
    execute: async (params) => {
      const payload = {
        event: "human_handoff",
        reason: params.reason,
        conversation_summary: params.conversation_summary,
        timestamp: new Date().toISOString(),
      };

      // Fire webhook if configured
      if (config.webhook_url) {
        try {
          await fetch(config.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          logger.error("Human handoff webhook failed", { err, url: config.webhook_url });
        }
      }

      // Log email notification intent (actual email sending would use Resend/SMTP)
      if (config.notify_email) {
        logger.info("Human handoff triggered — email notification requested", {
          to: config.notify_email,
          reason: params.reason,
        });
        // TODO: integrate with email provider (Resend) when email system is added
      }

      return {
        success: true,
        message:
          "A team member will be with you shortly. I've sent them a summary of our conversation.",
      };
    },
  });
}
