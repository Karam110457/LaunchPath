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

    for (const job of jobs as SendJob[]) {
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

      // Get batch of queued messages
      const { data: messages } = await supabase
        .from("template_send_messages")
        .select("id, phone, contact_id")
        .eq("job_id", job.id)
        .eq("status", "queued")
        .limit(BATCH_SIZE);

      if (!messages || messages.length === 0) {
        // No more queued messages — mark complete
        await supabase
          .from("template_send_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        continue;
      }

      const variableMapping = (job.variable_mapping ??
        template.variable_mapping ??
        {}) as Record<string, string>;

      // Process each message
      for (const msg of messages as SendMessage[]) {
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
          await supabase
            .from("template_send_messages")
            .update({
              status: "failed",
              error_message:
                err instanceof Error ? err.message : String(err),
            })
            .eq("id", msg.id);

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
