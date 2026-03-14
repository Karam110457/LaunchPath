/**
 * Sequence triggers — stop-on-reply, auto-enroll on tag/ingest.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { dispatchEvent } from "@/lib/events/dispatcher";

/**
 * Stop all active sequences for a contact when they reply.
 * Called from the WhatsApp webhook after processing an inbound message.
 */
export async function stopSequencesOnReply(
  supabase: SupabaseClient,
  channelId: string,
  phone: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // Find contact
  const { data: contact } = await fromAny("campaign_contacts")
    .select("id")
    .eq("channel_id", channelId)
    .eq("phone", phone)
    .single();

  if (!contact) return;

  // Find active enrollments where stop_on_reply is enabled
  const { data: states } = await fromAny("contact_sequence_state")
    .select("id, sequence_id")
    .eq("contact_id", contact.id)
    .eq("status", "active");

  if (!states || states.length === 0) return;

  // Check which sequences have stop_on_reply enabled
  const seqIds = (states as { id: string; sequence_id: string }[]).map((s) => s.sequence_id);
  const { data: sequences } = await fromAny("follow_up_sequences")
    .select("id, stop_on_reply")
    .in("id", seqIds)
    .eq("stop_on_reply", true);

  const stopSeqIds = new Set((sequences ?? []).map((s: { id: string }) => s.id));
  const stateIdsToStop = (states as { id: string; sequence_id: string }[])
    .filter((s) => stopSeqIds.has(s.sequence_id))
    .map((s) => s.id);

  if (stateIdsToStop.length === 0) return;

  await fromAny("contact_sequence_state")
    .update({
      status: "stopped_reply",
      stopped_at: new Date().toISOString(),
      stop_reason: "Customer replied",
    })
    .in("id", stateIdsToStop);

  // Dispatch event for each stopped sequence
  for (const state of (states as { id: string; sequence_id: string }[]).filter((s) => stopSeqIds.has(s.sequence_id))) {
    dispatchEvent(supabase, {
      channelId,
      eventType: "whatsapp.sequence.replied",
      payload: { phone, sequenceId: state.sequence_id },
    }).catch(() => {});
  }
}

/**
 * Check auto-enroll triggers when new tags are added to a contact.
 */
export async function checkAutoEnrollOnTag(
  supabase: SupabaseClient,
  contactId: string,
  channelId: string,
  newTags: string[]
): Promise<void> {
  if (newTags.length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  // Find active sequences with auto_enroll.on_tag matching
  const { data: sequences } = await fromAny("follow_up_sequences")
    .select("id, auto_enroll, steps")
    .eq("channel_id", channelId)
    .eq("status", "active");

  if (!sequences) return;

  for (const seq of sequences as { id: string; auto_enroll: { on_tag?: string[] }; steps: { delayMinutes: number }[] }[]) {
    const enrollTags = seq.auto_enroll?.on_tag;
    if (!enrollTags || enrollTags.length === 0) continue;

    // Check if any of the new tags match
    const hasMatch = newTags.some((t) => enrollTags.includes(t));
    if (!hasMatch) continue;

    // Check if already enrolled
    const { data: existing } = await fromAny("contact_sequence_state")
      .select("id")
      .eq("sequence_id", seq.id)
      .eq("contact_id", contactId)
      .eq("status", "active")
      .single();

    if (existing) continue;

    // Enroll
    const firstDelay = seq.steps[0]?.delayMinutes ?? 0;
    await fromAny("contact_sequence_state").insert({
      sequence_id: seq.id,
      contact_id: contactId,
      current_step: 0,
      status: "active",
      next_send_at: new Date(Date.now() + firstDelay * 60 * 1000).toISOString(),
    });
  }
}

/**
 * Check auto-enroll triggers when a new contact is ingested.
 */
export async function checkAutoEnrollOnIngest(
  supabase: SupabaseClient,
  contactId: string,
  channelId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromAny = supabase.from as any;

  const { data: sequences } = await fromAny("follow_up_sequences")
    .select("id, auto_enroll, steps")
    .eq("channel_id", channelId)
    .eq("status", "active");

  if (!sequences) return;

  for (const seq of sequences as { id: string; auto_enroll: { on_ingest?: boolean }; steps: { delayMinutes: number }[] }[]) {
    if (!seq.auto_enroll?.on_ingest) continue;

    const firstDelay = seq.steps[0]?.delayMinutes ?? 0;
    await fromAny("contact_sequence_state").insert({
      sequence_id: seq.id,
      contact_id: contactId,
      current_step: 0,
      status: "active",
      next_send_at: new Date(Date.now() + firstDelay * 60 * 1000).toISOString(),
    }).then(() => {}).catch(() => {
      // Ignore duplicate enrollment errors
    });
  }
}
