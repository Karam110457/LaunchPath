/**
 * Sequence Processor — Supabase Edge Function
 *
 * Processes active sequence enrollments whose next_send_at has passed.
 * Sends the current step's template message and advances to the next step.
 *
 * Triggered every minute by pg_cron via pg_net.
 * Auth: requires CRON_SECRET in Authorization header.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 50;
const META_API_VERSION = "v25.0";

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

interface SequenceStep {
  stepNumber: number;
  delayMinutes: number;
  templateId: string;
  stopOnReply?: boolean;
}

interface EnrollmentRow {
  id: string;
  sequence_id: string;
  contact_id: string;
  current_step: number;
}

// ── WhatsApp API helper ──────────────────────────────────────────────────

async function sendTemplateMessage(opts: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  language: string;
}): Promise<{ messageId: string }> {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${opts.phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: opts.to,
      type: "template",
      template: {
        name: opts.templateName,
        language: { code: opts.language },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as Record<string, unknown>)?.error;
    throw new Error(
      `WhatsApp API error ${res.status}: ${
        typeof detail === "object" && detail !== null
          ? (detail as Record<string, unknown>).message ?? JSON.stringify(detail)
          : JSON.stringify(err)
      }`
    );
  }

  const data = (await res.json()) as { messages?: { id: string }[] };
  return { messageId: data.messages?.[0]?.id ?? "" };
}

// ── Main handler ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Auth check
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalSent = 0;
  let totalFailed = 0;
  let totalCompleted = 0;

  try {
    // Get enrollments ready to send
    const { data: enrollments } = await supabase
      .from("contact_sequence_state")
      .select("id, sequence_id, contact_id, current_step")
      .eq("status", "active")
      .lte("next_send_at", new Date().toISOString())
      .order("next_send_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, sent: 0, failed: 0, completed: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Group by sequence_id for batch lookups
    const seqIds = [...new Set(enrollments.map((e: EnrollmentRow) => e.sequence_id))];

    // Load sequences
    const { data: sequences } = await supabase
      .from("follow_up_sequences")
      .select("id, channel_id, steps, status")
      .in("id", seqIds);

    const seqMap = new Map<string, { channel_id: string; steps: SequenceStep[]; status: string }>();
    for (const s of (sequences ?? []) as { id: string; channel_id: string; steps: SequenceStep[]; status: string }[]) {
      seqMap.set(s.id, s);
    }

    // Load channel configs
    const channelIds = [...new Set([...seqMap.values()].map((s) => s.channel_id))];
    const { data: channels } = await supabase
      .from("agent_channels")
      .select("id, config")
      .in("id", channelIds);

    const channelMap = new Map<string, WhatsAppConfig>();
    for (const c of (channels ?? []) as { id: string; config: unknown }[]) {
      channelMap.set(c.id, c.config as WhatsAppConfig);
    }

    // Process each enrollment
    for (const enrollment of enrollments as EnrollmentRow[]) {
      const seq = seqMap.get(enrollment.sequence_id);
      if (!seq || seq.status !== "active") {
        // Sequence was paused/archived — stop enrollment
        await supabase
          .from("contact_sequence_state")
          .update({
            status: "stopped_manual",
            stopped_at: new Date().toISOString(),
            stop_reason: "Sequence no longer active",
          })
          .eq("id", enrollment.id);
        continue;
      }

      const config = channelMap.get(seq.channel_id);
      if (!config?.accessToken || !config?.phoneNumberId) continue;

      const step = seq.steps[enrollment.current_step];
      if (!step) {
        // No more steps — mark completed
        await supabase
          .from("contact_sequence_state")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);
        totalCompleted++;
        continue;
      }

      // Load template
      const { data: template } = await supabase
        .from("whatsapp_templates")
        .select("name, language")
        .eq("id", step.templateId)
        .eq("status", "APPROVED")
        .single();

      if (!template) {
        // Template not found or not approved — skip this step but advance
        const nextStep = enrollment.current_step + 1;
        const nextStepDef = seq.steps[nextStep];
        if (nextStepDef) {
          await supabase
            .from("contact_sequence_state")
            .update({
              current_step: nextStep,
              next_send_at: new Date(Date.now() + nextStepDef.delayMinutes * 60 * 1000).toISOString(),
            })
            .eq("id", enrollment.id);
        } else {
          await supabase
            .from("contact_sequence_state")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", enrollment.id);
          totalCompleted++;
        }
        continue;
      }

      // Load contact phone
      const { data: contact } = await supabase
        .from("campaign_contacts")
        .select("phone, status")
        .eq("id", enrollment.contact_id)
        .single();

      if (!contact || (contact as { status: string }).status === "opted_out") {
        await supabase
          .from("contact_sequence_state")
          .update({
            status: "stopped_optout",
            stopped_at: new Date().toISOString(),
            stop_reason: "Contact opted out",
          })
          .eq("id", enrollment.id);
        continue;
      }

      try {
        await sendTemplateMessage({
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
          to: (contact as { phone: string }).phone,
          templateName: (template as { name: string }).name,
          language: (template as { language: string }).language,
        });

        totalSent++;

        // Advance to next step
        const nextStep = enrollment.current_step + 1;
        const nextStepDef = seq.steps[nextStep];

        if (nextStepDef) {
          await supabase
            .from("contact_sequence_state")
            .update({
              current_step: nextStep,
              last_sent_at: new Date().toISOString(),
              next_send_at: new Date(Date.now() + nextStepDef.delayMinutes * 60 * 1000).toISOString(),
            })
            .eq("id", enrollment.id);
        } else {
          // No more steps
          await supabase
            .from("contact_sequence_state")
            .update({
              status: "completed",
              last_sent_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);
          totalCompleted++;
        }

        // Update contact last_contacted_at
        await supabase
          .from("campaign_contacts")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", enrollment.contact_id);
      } catch (err) {
        totalFailed++;
        console.error(`Sequence send failed for enrollment ${enrollment.id}:`, err);
      }
    }

    console.log(
      `Sequence processor: processed=${enrollments.length} sent=${totalSent} failed=${totalFailed} completed=${totalCompleted}`
    );

    return new Response(
      JSON.stringify({
        processed: enrollments.length,
        sent: totalSent,
        failed: totalFailed,
        completed: totalCompleted,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sequence processor cron failed:", err);
    return new Response(
      JSON.stringify({ error: "Cron processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
