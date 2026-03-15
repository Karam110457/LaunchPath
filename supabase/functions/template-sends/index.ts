/**
 * Template Send Batch Processor — Supabase Edge Function
 *
 * Processes pending/processing send jobs by batching queued messages
 * and calling Meta's WhatsApp Cloud API.
 *
 * Triggered every minute by pg_cron via pg_net.
 *
 * Auth: requires CRON_SECRET in Authorization header.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 50;
const META_API_VERSION = "v25.0";
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]; // 1m, 5m, 15m

// Types
interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  verifyToken: string;
}

interface TemplateComponent {
  type: string;
  text?: string;
  parameters?: { type: string; text: string }[];
}

interface SendJob {
  id: string;
  channel_id: string;
  status: string;
  sent_count: number;
  failed_count: number;
  variable_mapping: Record<string, string> | null;
  whatsapp_templates: {
    name: string;
    language: string;
    components: TemplateComponent[];
    variable_mapping: Record<string, string> | null;
  } | null;
}

interface SendMessage {
  id: string;
  phone: string;
  contact_id: string | null;
}

interface Contact {
  name: string | null;
  phone: string;
  email: string | null;
  custom_fields: Record<string, string> | null;
}

// ── WhatsApp API helper ──────────────────────────────────────────────────

async function sendTemplateMessage(opts: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  language: string;
  components?: Record<string, unknown>[];
}): Promise<{ messageId: string }> {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${opts.phoneNumberId}/messages`;

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: opts.to,
    type: "template",
    template: {
      name: opts.templateName,
      language: { code: opts.language },
      ...(opts.components ? { components: opts.components } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

// ── Variable resolution ──────────────────────────────────────────────────

function resolveTemplateVariables(
  template: SendJob["whatsapp_templates"],
  variableMapping: Record<string, string>,
  contact: Contact
): Record<string, unknown>[] | undefined {
  if (!template || Object.keys(variableMapping).length === 0) return undefined;

  const bodyComponent = template.components.find(
    (c) => c.type === "BODY"
  );
  if (!bodyComponent?.text) return undefined;

  const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g);
  if (!matches || matches.length === 0) return undefined;

  const parameters = matches.map((m: string) => {
    const key = m.replace(/[{}]/g, "");
    const field = variableMapping[key];
    let value = key; // fallback to placeholder number

    if (field) {
      if (field.startsWith("custom_fields.")) {
        const cfKey = field.replace("custom_fields.", "");
        value = contact.custom_fields?.[cfKey] ?? key;
      } else {
        value = (contact as unknown as Record<string, string>)[field] ?? key;
      }
    }

    return { type: "text", text: value };
  });

  return [{ type: "body", parameters }];
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

  try {
    // Get pending/processing jobs
    const { data: jobs } = await supabase
      .from("template_send_jobs")
      .select(
        "*, whatsapp_templates(name, language, components, variable_mapping)"
      )
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true })
      .limit(10);

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, sent: 0, failed: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Filter out scheduled jobs that aren't due yet
    const now = new Date().toISOString();
    const readyJobs = (jobs as SendJob[]).filter((job) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scheduledFor = (job as any).scheduled_for;
      if (scheduledFor && scheduledFor > now) return false;
      return true;
    });

    if (readyJobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, sent: 0, failed: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    for (const job of readyJobs) {
      // Mark as processing
      if (job.status === "pending") {
        await supabase
          .from("template_send_jobs")
          .update({
            status: "processing",
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }

      // Check if cancelled
      const { data: freshJob } = await supabase
        .from("template_send_jobs")
        .select("status")
        .eq("id", job.id)
        .single();

      if (freshJob?.status === "cancelled") continue;

      // Get channel config
      const { data: channel } = await supabase
        .from("agent_channels")
        .select("config")
        .eq("id", job.channel_id)
        .single();

      if (!channel) {
        await supabase
          .from("template_send_jobs")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        continue;
      }

      const config = channel.config as unknown as WhatsAppConfig;
      const template = job.whatsapp_templates;

      if (!template || !config.accessToken || !config.phoneNumberId) {
        await supabase
          .from("template_send_jobs")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        continue;
      }

      // Atomically claim a batch of queued messages to prevent duplicate
      // processing when concurrent cron invocations overlap.
      const claimToken = crypto.randomUUID();
      const { count: claimedCount } = await supabase.rpc("claim_send_messages", {
        p_job_id: job.id,
        p_claim_token: claimToken,
        p_limit: BATCH_SIZE,
      });

      if (!claimedCount || claimedCount === 0) {
        // No more queued messages — check if job is truly done
        const { data: remaining } = await supabase
          .from("template_send_messages")
          .select("id", { count: "exact", head: true })
          .eq("job_id", job.id)
          .in("status", ["queued", "processing"]);

        if (!remaining || (remaining as unknown[]).length === 0) {
          await supabase
            .from("template_send_jobs")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        }
        continue;
      }

      // Fetch the claimed messages (also filter out opted-out contacts)
      const { data: messages } = await supabase
        .from("template_send_messages")
        .select("id, phone, contact_id, retry_count, next_retry_at")
        .eq("job_id", job.id)
        .eq("claim_token", claimToken);

      const variableMapping = (job.variable_mapping ??
        template.variable_mapping ??
        {}) as Record<string, string>;

      if (!messages || messages.length === 0) continue;

      // Filter out messages that aren't ready for retry yet
      const nowMs = Date.now();
      const readyMessages = (messages as (SendMessage & { retry_count?: number; next_retry_at?: string })[]).filter((m) => {
        if (m.next_retry_at && new Date(m.next_retry_at).getTime() > nowMs) return false;
        return true;
      });

      if (readyMessages.length === 0) continue;

      // Filter out opted-out contacts before sending
      const contactIdsInBatch = readyMessages
        .map((m) => m.contact_id)
        .filter(Boolean) as string[];
      const optedOutIds = new Set<string>();
      if (contactIdsInBatch.length > 0) {
        const { data: optedOut } = await supabase
          .from("campaign_contacts")
          .select("id")
          .in("id", contactIdsInBatch)
          .eq("status", "opted_out");
        for (const c of optedOut ?? []) {
          optedOutIds.add((c as { id: string }).id);
        }
      }

      // Process each message
      for (const msg of readyMessages) {
        // Skip opted-out contacts
        if (msg.contact_id && optedOutIds.has(msg.contact_id)) {
          await supabase
            .from("template_send_messages")
            .update({ status: "skipped", error_message: "Contact opted out" })
            .eq("id", msg.id);
          continue;
        }

        try {
          let resolvedComponents: Record<string, unknown>[] | undefined;

          if (
            Object.keys(variableMapping).length > 0 &&
            msg.contact_id
          ) {
            const { data: contact } = await supabase
              .from("campaign_contacts")
              .select("name, phone, email, custom_fields")
              .eq("id", msg.contact_id)
              .single();

            if (contact) {
              resolvedComponents = resolveTemplateVariables(
                template,
                variableMapping,
                contact as Contact
              );
            }
          }

          const result = await sendTemplateMessage({
            phoneNumberId: config.phoneNumberId,
            accessToken: config.accessToken,
            to: msg.phone,
            templateName: template.name,
            language: template.language,
            components: resolvedComponents,
          });

          await supabase
            .from("template_send_messages")
            .update({
              status: "sent",
              whatsapp_message_id: result.messageId,
              sent_at: new Date().toISOString(),
            })
            .eq("id", msg.id);

          totalSent++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentRetry = (msg as any).retry_count ?? 0;

          if (currentRetry < MAX_RETRIES) {
            const delayMs = RETRY_DELAYS_MS[currentRetry] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
            const nextRetryAt = new Date(Date.now() + delayMs).toISOString();
            await supabase
              .from("template_send_messages")
              .update({
                status: "queued",
                retry_count: currentRetry + 1,
                last_error: errorMessage,
                next_retry_at: nextRetryAt,
              })
              .eq("id", msg.id);
          } else {
            await supabase
              .from("template_send_messages")
              .update({
                status: "failed",
                error_message: errorMessage,
                last_error: errorMessage,
              })
              .eq("id", msg.id);
          }

          totalFailed++;
        }
      }

      // Recount from actual message statuses to avoid race conditions
      const { data: msgStatuses } = await supabase
        .from("template_send_messages")
        .select("status")
        .eq("job_id", job.id);

      if (msgStatuses) {
        const statusArr = msgStatuses as { status: string }[];
        const sentCount = statusArr.filter((m) =>
          ["sent", "delivered", "read"].includes(m.status)
        ).length;
        const deliveredCount = statusArr.filter((m) =>
          ["delivered", "read"].includes(m.status)
        ).length;
        const readCount = statusArr.filter(
          (m) => m.status === "read"
        ).length;
        const failedCount = statusArr.filter(
          (m) => m.status === "failed"
        ).length;
        const queuedCount = statusArr.filter(
          (m) => m.status === "queued"
        ).length;

        const jobUpdate: Record<string, unknown> = {
          sent_count: sentCount,
          delivered_count: deliveredCount,
          read_count: readCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        };

        if (queuedCount === 0) {
          jobUpdate.status = "completed";
          jobUpdate.completed_at = new Date().toISOString();
        }

        await supabase
          .from("template_send_jobs")
          .update(jobUpdate)
          .eq("id", job.id);
      }
    }

    console.log(
      `Template send cron: processed=${jobs.length} sent=${totalSent} failed=${totalFailed}`
    );

    return new Response(
      JSON.stringify({
        processed: jobs.length,
        sent: totalSent,
        failed: totalFailed,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Template send cron failed:", err);
    return new Response(
      JSON.stringify({ error: "Cron processing failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
