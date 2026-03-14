/**
 * System tools injected into WhatsApp agent conversations.
 * These tools let the agent interact with campaign infrastructure.
 */

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAutoEnrollOnTag } from "@/lib/sequences/triggers";
import { dispatchEvent } from "@/lib/events/dispatcher";

/**
 * Build the `tag_contact` tool for WhatsApp conversations.
 * Allows the agent to tag contacts during conversation for CRM and sequence triggers.
 */
export function buildTagContactTool(params: {
  supabase: SupabaseClient;
  channelId: string;
  phone: string;
}) {
  const { supabase, channelId, phone } = params;

  return {
    tag_contact: {
      description:
        "Tag the current contact with one or more labels. Use this to categorize contacts based on conversation context (e.g., 'interested', 'needs-follow-up', 'premium-lead'). Tags trigger automated sequences and CRM updates.",
      inputSchema: z.object({
        tags: z.array(z.string()).describe("Tags to add to the contact"),
      }),
      execute: async ({ tags }: { tags: string[] }) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fromAny = supabase.from as any;

          // Get current contact
          const { data: contact } = await fromAny("campaign_contacts")
            .select("id, tags")
            .eq("channel_id", channelId)
            .eq("phone", phone)
            .single();

          if (!contact) {
            return { success: false, message: "Contact not found" };
          }

          // Merge tags (deduplicate)
          const currentTags = (contact.tags ?? []) as string[];
          const newTags = tags.filter((t) => !currentTags.includes(t));
          const mergedTags = [...currentTags, ...newTags];

          // Update contact
          await fromAny("campaign_contacts")
            .update({
              tags: mergedTags,
              updated_at: new Date().toISOString(),
            })
            .eq("id", contact.id);

          // Check auto-enroll triggers
          if (newTags.length > 0) {
            await checkAutoEnrollOnTag(supabase, contact.id, channelId, newTags).catch(() => {});

            // Dispatch event
            dispatchEvent(supabase, {
              channelId,
              eventType: "whatsapp.contact.tagged",
              payload: { phone, tags: newTags, allTags: mergedTags },
            }).catch(() => {});
          }

          return {
            success: true,
            message: `Added tags: ${newTags.join(", ")}${newTags.length === 0 ? " (all tags already existed)" : ""}`,
          };
        } catch (err) {
          return {
            success: false,
            message: `Failed to tag contact: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    },
  };
}

/** System prompt addition when tag_contact tool is available */
export const TAG_TOOL_SYSTEM_PROMPT = `
You have access to a tag_contact tool. Use it proactively to categorize contacts based on the conversation:
- Tag contacts as "interested" when they express buying intent
- Tag contacts as "needs-follow-up" when they have unresolved questions
- Tag contacts as "premium-lead" for high-value prospects
- Tag contacts with relevant product/service interests mentioned
Apply tags naturally based on conversation context without asking the user for permission.
`.trim();
