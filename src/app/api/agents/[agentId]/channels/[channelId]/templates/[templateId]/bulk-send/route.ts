/**
 * Bulk Template Send API
 * POST /api/agents/[agentId]/channels/[channelId]/templates/[templateId]/bulk-send
 *
 * Creates a send job + queued messages. The cron processor handles actual sending.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/security/logger";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      agentId: string;
      channelId: string;
      templateId: string;
    }>;
  }
) {
  const { agentId, channelId, templateId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify channel ownership
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id, config")
    .eq("id", channelId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Verify template is approved
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template } = await (supabase.from as any)("whatsapp_templates")
    .select("*")
    .eq("id", templateId)
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Only APPROVED templates can be sent" },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    audience_filter?: {
      tags?: string[];
      status?: string;
      date_from?: string;
      date_to?: string;
    };
    variable_mapping?: Record<string, string>;
    scheduled_for?: string;
  };

  // Validate scheduled_for if provided
  if (body.scheduled_for) {
    const scheduledDate = new Date(body.scheduled_for);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Invalid scheduled_for date" }, { status: 400 });
    }
    if (scheduledDate.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: "scheduled_for must be in the future" }, { status: 400 });
    }
  }

  // Build audience query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contactQuery = (supabase.from as any)("campaign_contacts")
    .select("id, phone, name, email, custom_fields")
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  const filter = body.audience_filter;
  if (filter?.tags && filter.tags.length > 0) {
    contactQuery = contactQuery.contains("tags", filter.tags);
  }
  if (filter?.status) {
    contactQuery = contactQuery.eq("status", filter.status);
  }

  const { data: contacts, error: contactsError } = await contactQuery;

  if (contactsError || !contacts || contacts.length === 0) {
    return NextResponse.json(
      { error: "No contacts match the audience filter" },
      { status: 400 }
    );
  }

  // Create send job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job, error: jobError } = await (supabase.from as any)("template_send_jobs")
    .insert({
      channel_id: channelId,
      user_id: user.id,
      template_id: templateId,
      status: "pending",
      audience_filter: body.audience_filter ?? null,
      variable_mapping: body.variable_mapping ?? template.variable_mapping ?? null,
      total_contacts: contacts.length,
      scheduled_for: body.scheduled_for ?? null,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    logger.error("Failed to create send job", { error: jobError?.message });
    return NextResponse.json({ error: "Failed to create send job" }, { status: 500 });
  }

  // Queue messages
  const messages = contacts.map((c: Record<string, unknown>) => ({
    job_id: job.id,
    contact_id: c.id,
    phone: c.phone,
    status: "queued",
  }));

  // Insert in batches of 500
  for (let i = 0; i < messages.length; i += 500) {
    const batch = messages.slice(i, i + 500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("template_send_messages").insert(batch);
  }

  logger.info("Bulk send job created", {
    jobId: job.id,
    templateId,
    contacts: contacts.length,
  });

  return NextResponse.json(
    {
      job: {
        id: job.id,
        total_contacts: contacts.length,
        status: "pending",
      },
    },
    { status: 201 }
  );
}
