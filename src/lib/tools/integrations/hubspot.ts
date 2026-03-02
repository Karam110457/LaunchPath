import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/security/logger";
import type { HubSpotConfig } from "../types";

export function buildHubSpotTool(config: HubSpotConfig, description: string) {
  return tool({
    description,
    inputSchema: z.object({
      email: z.string().email().optional().describe("Contact's email address"),
      firstname: z.string().optional().describe("Contact's first name"),
      lastname: z.string().optional().describe("Contact's last name"),
      phone: z.string().optional().describe("Contact's phone number"),
    }),
    execute: async (params) => {
      if (!params.email && !params.firstname && !params.phone) {
        return {
          success: false,
          message: "I need at least a name, email, or phone number to create a contact.",
        };
      }

      try {
        const properties: Record<string, string> = {};
        if (params.email) properties.email = params.email;
        if (params.firstname) properties.firstname = params.firstname;
        if (params.lastname) properties.lastname = params.lastname;
        if (params.phone) properties.phone = params.phone;

        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ properties }),
        });

        if (!res.ok) {
          // 409 = contact already exists (by email)
          if (res.status === 409) {
            return {
              success: true,
              message: `${params.firstname ?? params.email ?? "That contact"} already exists in HubSpot — no duplicate was created.`,
            };
          }
          const text = await res.text();
          logger.error("HubSpot contact creation failed", { status: res.status, body: text });
          return {
            success: false,
            message: "I wasn't able to save that contact to HubSpot right now, but I've noted the details.",
          };
        }

        const data = (await res.json()) as { id: string };
        return {
          success: true,
          contact_id: data.id,
          message: `Got it — I've saved ${params.firstname ?? params.email ?? "the contact"}'s information to your HubSpot CRM.`,
        };
      } catch (err) {
        logger.error("HubSpot tool execution error", { err });
        return {
          success: false,
          message: "I wasn't able to reach HubSpot right now, but I've noted the contact details.",
        };
      }
    },
  });
}
