/**
 * Template List & Create API
 * GET  /api/agents/[agentId]/channels/[channelId]/templates  — list templates
 * POST /api/agents/[agentId]/channels/[channelId]/templates  — create & submit template to Meta
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitTemplateToMeta } from "@/lib/channels/whatsapp";
import type { TemplateComponent } from "@/lib/channels/whatsapp";
import { logger } from "@/lib/security/logger";

async function verifyChannelOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentId: string,
  channelId: string,
  userId: string
) {
  const { data } = await supabase
    .from("agent_channels")
    .select("id, config, channel_type")
    .eq("id", channelId)
    .eq("agent_id", agentId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string; channelId: string }> }
) {
  const { agentId, channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const channel = await verifyChannelOwnership(supabase, agentId, channelId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from as any)("whatsapp_templates")
    .select("*", { count: "exact" })
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: templates, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }

  return NextResponse.json({
    templates: templates ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

const VALID_CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string; channelId: string }> }
) {
  const { agentId, channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const channel = await verifyChannelOwnership(supabase, agentId, channelId, user.id);
  if (!channel || channel.channel_type !== "whatsapp") {
    return NextResponse.json({ error: "WhatsApp channel not found" }, { status: 404 });
  }

  const config = channel.config as Record<string, unknown>;
  const accessToken = config?.accessToken as string | undefined;
  const businessAccountId = config?.businessAccountId as string | undefined;

  if (!accessToken || !businessAccountId) {
    return NextResponse.json(
      { error: "Missing accessToken or businessAccountId" },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    name?: string;
    language?: string;
    category?: string;
    components?: TemplateComponent[];
    example_values?: Record<string, unknown>;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!body.components || !Array.isArray(body.components) || body.components.length === 0) {
    return NextResponse.json({ error: "components array is required" }, { status: 400 });
  }

  const language = body.language ?? "en_US";

  try {
    // Submit to Meta
    const { id: metaId } = await submitTemplateToMeta({
      businessAccountId,
      accessToken,
      template: {
        name: body.name.trim(),
        language,
        category: body.category,
        components: body.components,
      },
    });

    // Insert locally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template, error } = await (supabase.from as any)("whatsapp_templates")
      .insert({
        channel_id: channelId,
        user_id: user.id,
        name: body.name.trim(),
        language,
        category: body.category,
        status: "PENDING",
        components: body.components,
        meta_template_id: metaId,
        example_values: body.example_values ?? {},
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to insert template locally", {
        channelId,
        error: error.message,
      });
      return NextResponse.json({ error: "Template submitted to Meta but failed to save locally" }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    logger.error("Template creation failed", {
      channelId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create template" },
      { status: 500 }
    );
  }
}
