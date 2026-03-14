/**
 * Template Send Cron Processor
 * POST /api/cron/template-sends
 *
 * Processes pending/processing send jobs by batching queued messages.
 * Schedule: every 1 minute → ~50 messages/batch → ~3000/hour.
 *
 * Requires CRON_SECRET header (same pattern as auto-close).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTemplateMessage } from "@/lib/channels/whatsapp";
import type { WhatsAppConfig } from "@/lib/channels/types";
import { logger } from "@/lib/security/logger";

const BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  // Verify cron secret (skip in dev)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();
  let totalSent = 0;
  let totalFailed = 0;

  try {
    // Get pending/processing jobs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: jobs } = await (supabase.from as any)("template_send_jobs")
      .select("*, whatsapp_templates(name, language, components, variable_mapping)")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true })
      .limit(10);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
    }

    for (const job of jobs) {
      // Mark as processing
      if (job.status === "pending") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)("template_send_jobs")
          .update({
            status: "processing",
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }

      // Check if cancelled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: freshJob } = await (supabase.from as any)("template_send_jobs")
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)("template_send_jobs")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        continue;
      }

      const config = channel.config as unknown as WhatsAppConfig;
      const template = job.whatsapp_templates;

      if (!template || !config.accessToken || !config.phoneNumberId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)("template_send_jobs")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        continue;
      }

      // Get batch of queued messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: messages } = await (supabase.from as any)("template_send_messages")
        .select("id, phone, contact_id")
        .eq("job_id", job.id)
        .eq("status", "queued")
        .limit(BATCH_SIZE);

      if (!messages || messages.length === 0) {
        // No more queued messages — mark complete
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)("template_send_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        continue;
      }

      // Build template components for variable resolution
      const variableMapping = (job.variable_mapping ?? template.variable_mapping ?? {}) as Record<string, string>;

      for (const msg of messages) {
        try {
          // Resolve variables from contact if mapped
          let resolvedComponents: Record<string, unknown>[] | undefined;

          if (Object.keys(variableMapping).length > 0 && msg.contact_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: contact } = await (supabase.from as any)("campaign_contacts")
              .select("name, phone, email, custom_fields")
              .eq("id", msg.contact_id)
              .single();

            if (contact) {
              const bodyText = (template.components as Record<string, unknown>[])
                .find((c: Record<string, unknown>) => c.type === "BODY")?.text as string | undefined;

              if (bodyText) {
                const matches = bodyText.match(/\{\{(\d+)\}\}/g);
                if (matches && matches.length > 0) {
                  const parameters = matches.map((m: string) => {
                    const key = m.replace(/[{}]/g, "");
                    const field = variableMapping[key];
                    let value = key;

                    if (field) {
                      if (field.startsWith("custom_fields.")) {
                        const cfKey = field.replace("custom_fields.", "");
                        value = (contact.custom_fields as Record<string, string>)?.[cfKey] ?? key;
                      } else {
                        value = (contact as Record<string, string>)[field] ?? key;
                      }
                    }

                    return { type: "text", text: value };
                  });
                  resolvedComponents = [{ type: "body", parameters }];
                }
              }
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

          // Update message status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from as any)("template_send_messages")
            .update({
              status: "sent",
              whatsapp_message_id: result.messageId,
              sent_at: new Date().toISOString(),
            })
            .eq("id", msg.id);

          // Increment job counter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from as any)("template_send_jobs")
            .update({
              sent_count: job.sent_count + totalSent + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          totalSent++;
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from as any)("template_send_messages")
            .update({
              status: "failed",
              error_message: err instanceof Error ? err.message : String(err),
            })
            .eq("id", msg.id);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from as any)("template_send_jobs")
            .update({
              failed_count: job.failed_count + totalFailed + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          totalFailed++;
        }
      }
    }

    logger.info("Template send cron completed", {
      processed: jobs.length,
      sent: totalSent,
      failed: totalFailed,
    });

    return NextResponse.json({
      processed: jobs.length,
      sent: totalSent,
      failed: totalFailed,
    });
  } catch (err) {
    logger.error("Template send cron failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Cron processing failed" },
      { status: 500 }
    );
  }
}
