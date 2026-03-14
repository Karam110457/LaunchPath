/**
 * Single Template Send API
 * POST /api/agents/[agentId]/channels/[channelId]/templates/[templateId]/send
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplateMessage } from "@/lib/channels/whatsapp";
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

  // Verify channel
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

  const config = channel.config as Record<string, unknown>;
  const accessToken = config?.accessToken as string;
  const phoneNumberId = config?.phoneNumberId as string;

  if (!accessToken || !phoneNumberId) {
    return NextResponse.json({ error: "Channel not configured" }, { status: 400 });
  }

  // Get template
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
    phone: string;
    variable_values?: Record<string, string>;
  };

  if (!body.phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  // Build template components for sending
  const variableMapping = (template.variable_mapping ?? {}) as Record<string, string>;
  const variableValues = body.variable_values ?? {};
  const components: Record<string, unknown>[] = [];

  // Extract body variables
  const bodyText = (template.components as Record<string, unknown>[])
    .find((c) => c.type === "BODY")?.text as string | undefined;

  if (bodyText) {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g);
    if (matches && matches.length > 0) {
      const parameters = matches.map((m) => {
        const key = m.replace(/[{}]/g, "");
        const value = variableValues[key] ?? variableMapping[key] ?? key;
        return { type: "text", text: value };
      });
      components.push({ type: "body", parameters });
    }
  }

  try {
    const result = await sendTemplateMessage({
      phoneNumberId,
      accessToken,
      to: body.phone,
      templateName: template.name,
      language: template.language,
      components: components.length > 0 ? components : undefined,
    });

    // Create tracking records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job } = await (supabase.from as any)("template_send_jobs")
      .insert({
        channel_id: channelId,
        user_id: user.id,
        template_id: templateId,
        status: "completed",
        total_contacts: 1,
        sent_count: 1,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (job) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)("template_send_messages").insert({
        job_id: job.id,
        phone: body.phone,
        whatsapp_message_id: result.messageId,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (err) {
    logger.error("Template send failed", {
      templateId,
      phone: body.phone,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}
