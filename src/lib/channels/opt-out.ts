/**
 * Opt-out keyword detection and handling for WhatsApp channels.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "./whatsapp";

const OPT_OUT_KEYWORDS = new Set([
  "stop",
  "unsubscribe",
  "opt out",
  "opt-out",
  "don't message",
  "dont message",
  "cancel",
  "end",
  "quit",
]);

const OPT_IN_KEYWORDS = new Set([
  "start",
  "subscribe",
  "opt in",
  "opt-in",
  "resume",
  "unstop",
]);

/** Check if a message text is an opt-out keyword. */
export function isOptOutKeyword(text: string | undefined): boolean {
  if (!text) return false;
  return OPT_OUT_KEYWORDS.has(text.trim().toLowerCase());
}

/** Check if a message text is an opt-in (re-subscribe) keyword. */
export function isOptInKeyword(text: string | undefined): boolean {
  if (!text) return false;
  return OPT_IN_KEYWORDS.has(text.trim().toLowerCase());
}

/** Handle opt-out: mark contact as opted_out, stop sequences, send confirmation. */
export async function handleOptOut(params: {
  supabase: SupabaseClient;
  channelId: string;
  phone: string;
  phoneNumberId: string;
  accessToken: string;
}): Promise<void> {
  const { supabase, channelId, phone, phoneNumberId, accessToken } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // 1. Mark contact as opted_out
  await fromAny("campaign_contacts")
    .update({ status: "opted_out", updated_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("phone", phone);

  // 2. Stop all active sequences for this contact
  const { data: contact } = await fromAny("campaign_contacts")
    .select("id")
    .eq("channel_id", channelId)
    .eq("phone", phone)
    .single();

  if (contact) {
    await fromAny("contact_sequence_state")
      .update({
        status: "stopped_optout",
        stopped_at: new Date().toISOString(),
        stop_reason: "Contact opted out",
      })
      .eq("contact_id", contact.id)
      .eq("status", "active");
  }

  // 3. Send confirmation message
  await sendWhatsAppMessage({
    phoneNumberId,
    accessToken,
    to: phone,
    text: "You've been unsubscribed and won't receive further messages from us. Reply START to re-subscribe.",
  });
}

/** Handle opt-in: mark contact as active, send confirmation. */
export async function handleOptIn(params: {
  supabase: SupabaseClient;
  channelId: string;
  phone: string;
  phoneNumberId: string;
  accessToken: string;
}): Promise<void> {
  const { supabase, channelId, phone, phoneNumberId, accessToken } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // Re-activate the contact
  await fromAny("campaign_contacts")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("phone", phone)
    .eq("status", "opted_out");

  // Send confirmation message
  await sendWhatsAppMessage({
    phoneNumberId,
    accessToken,
    to: phone,
    text: "You've been re-subscribed and will receive messages from us again. Reply STOP at any time to unsubscribe.",
  });
}
