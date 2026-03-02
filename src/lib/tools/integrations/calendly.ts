import { tool } from "ai";
import { z } from "zod";
import type { CalendlyConfig } from "../types";

export function buildCalendlyTool(config: CalendlyConfig, description: string) {
  return tool({
    description,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe("Brief reason the user wants to book (e.g. 'free consultation', 'follow-up call')"),
    }),
    execute: async (params) => {
      return {
        booking_url: config.booking_url,
        message: params.reason
          ? `Here's the link to schedule your ${params.reason}: ${config.booking_url}`
          : `Here's the booking link: ${config.booking_url}`,
      };
    },
  });
}
