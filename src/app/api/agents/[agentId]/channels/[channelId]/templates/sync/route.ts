/**
 * Template Sync API
 * POST /api/agents/[agentId]/channels/[channelId]/templates/sync
 *
 * Triggers a full template sync from Meta's Graph API.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncTemplatesFromMeta } from "@/lib/channels/whatsapp";
import { logger } from "@/lib/security/logger";

export async function POST(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ agentId: string; channelId: string }> }
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

  // Fetch channel with raw config (not masked)
  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id, config, channel_type")
    .eq("id", channelId)
    .eq("agent_id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  if (channel.channel_type !== "whatsapp") {
    return NextResponse.json(
      { error: "Only WhatsApp channels support templates" },
      { status: 400 }
    );
  }

  const config = channel.config as Record<string, unknown>;
  const accessToken = config?.accessToken as string | undefined;
  const businessAccountId = config?.businessAccountId as string | undefined;

  if (!accessToken || !businessAccountId) {
    return NextResponse.json(
      {
        error:
          "Missing accessToken or businessAccountId in channel config. Configure these in the Credentials tab first.",
      },
      { status: 400 }
    );
  }

  try {
    const metaTemplates = await syncTemplatesFromMeta({
      businessAccountId,
      accessToken,
    });

    let created = 0;
    let updated = 0;

    for (const t of metaTemplates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error, data } = await (supabase.from as any)("whatsapp_templates")
        .upsert(
          {
            channel_id: channelId,
            user_id: user.id,
            name: t.name,
            language: t.language,
            category: t.category,
            status: t.status,
            components: t.components,
            meta_template_id: t.id,
            rejected_reason: t.rejected_reason ?? null,
            quality_score: t.quality_score?.score ?? null,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "channel_id,name,language" }
        )
        .select("id, created_at, updated_at")
        .single();

      if (!error && data) {
        // If created_at and updated_at are very close, it's a new record
        const createdAt = new Date(data.created_at).getTime();
        const updatedAt = new Date(data.updated_at).getTime();
        if (Math.abs(updatedAt - createdAt) < 1000) {
          created++;
        } else {
          updated++;
        }
      }
    }

    logger.info("Template sync completed", {
      channelId,
      synced: metaTemplates.length,
      created,
      updated,
    });

    return NextResponse.json({
      synced: metaTemplates.length,
      created,
      updated,
    });
  } catch (err) {
    logger.error("Template sync failed", {
      channelId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to sync templates",
      },
      { status: 500 }
    );
  }
}
