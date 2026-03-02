import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/security/logger";
import type { GHLConfig } from "../types";

export function buildGHLTool(config: GHLConfig, description: string) {
  return tool({
    description,
    inputSchema: z.object({
      first_name: z.string().describe("Contact's first name"),
      last_name: z.string().optional().describe("Contact's last name"),
      email: z.string().email().optional().describe("Contact's email address"),
      phone: z.string().optional().describe("Contact's phone number"),
      notes: z.string().optional().describe("Any additional notes about this lead"),
    }),
    execute: async (params) => {
      try {
        const body: Record<string, unknown> = {
          firstName: params.first_name,
          locationId: config.location_id,
          source: "AI Agent",
        };
        if (params.last_name) body.lastName = params.last_name;
        if (params.email) body.email = params.email;
        if (params.phone) body.phone = params.phone;
        if (params.notes) body.customFields = [{ key: "agent_notes", value: params.notes }];

        const res = await fetch("https://services.leadconnectorhq.com/contacts/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.api_key}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text();
          logger.error("GHL contact creation failed", { status: res.status, body: text });
          return {
            success: false,
            message: "I wasn't able to save that contact to GoHighLevel right now, but I've noted the details.",
          };
        }

        const data = (await res.json()) as { contact?: { id: string } };
        return {
          success: true,
          contact_id: data.contact?.id,
          message: `Got it — I've saved ${params.first_name}${params.last_name ? " " + params.last_name : ""}'s information to your CRM.`,
        };
      } catch (err) {
        logger.error("GHL tool execution error", { err });
        return {
          success: false,
          message: "I wasn't able to reach GoHighLevel right now, but I've noted the contact details.",
        };
      }
    },
  });
}
