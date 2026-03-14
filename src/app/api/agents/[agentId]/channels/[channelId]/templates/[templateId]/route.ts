/**
 * Single Template API
 * GET    /api/agents/[agentId]/channels/[channelId]/templates/[templateId]
 * PATCH  /api/agents/[agentId]/channels/[channelId]/templates/[templateId]  — update local fields (variable_mapping, example_values)
 * DELETE /api/agents/[agentId]/channels/[channelId]/templates/[templateId]  — delete from Meta + local
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteTemplateFromMeta } from "@/lib/channels/whatsapp";
import { logger } from "@/lib/security/logger";

type RouteParams = {
  params: Promise<{ agentId: string; channelId: string; templateId: string }>;
};

async function getTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  channelId: string,
  templateId: string,
  userId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("whatsapp_templates")
    .select("*")
    .eq("id", templateId)
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { channelId, templateId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const template = await getTemplate(supabase, channelId, templateId, user.id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  const { channelId, templateId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await getTemplate(supabase, channelId, templateId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    variable_mapping?: Record<string, unknown>;
    example_values?: Record<string, unknown>;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.variable_mapping !== undefined) {
    updates.variable_mapping = body.variable_mapping;
  }
  if (body.example_values !== undefined) {
    updates.example_values = body.example_values;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template, error } = await (supabase.from as any)("whatsapp_templates")
    .update(updates)
    .eq("id", templateId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }

  return NextResponse.json({ template });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
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

  const template = await getTemplate(supabase, channelId, templateId, user.id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Get channel config for Meta API call
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("config")
    .eq("id", channelId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (channel) {
    const config = channel.config as Record<string, unknown>;
    const accessToken = config?.accessToken as string;
    const businessAccountId = config?.businessAccountId as string;

    if (accessToken && businessAccountId) {
      try {
        await deleteTemplateFromMeta({
          businessAccountId,
          accessToken,
          templateName: template.name,
        });
      } catch (err) {
        logger.warn("Failed to delete template from Meta (continuing with local delete)", {
          templateId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("whatsapp_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
