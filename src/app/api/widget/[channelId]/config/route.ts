/**
 * Widget Config API (public — no auth)
 * GET /api/widget/[channelId]/config
 *
 * Returns widget appearance config + token for the embeddable widget JS.
 * Uses service role client since there's no authenticated session.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const supabase = createServiceClient();

  const { data: channel } = await supabase
    .from("agent_channels")
    .select("id, agent_id, token, config, is_enabled, allowed_origins")
    .eq("id", channelId)
    .eq("channel_type", "widget")
    .eq("is_enabled", true)
    .single();

  if (!channel) {
    return NextResponse.json(
      { error: "Widget not found" },
      { status: 404, headers: corsHeaders(request.headers.get("origin")) }
    );
  }

  // CORS origin check
  const origin = request.headers.get("origin");
  const allowedOrigins = (channel.allowed_origins as string[]) ?? [];
  if (allowedOrigins.length > 0 && origin) {
    if (!allowedOrigins.includes(origin) && !allowedOrigins.includes("*")) {
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }
  }

  return NextResponse.json(
    {
      channelId: channel.id,
      agentId: channel.agent_id,
      token: channel.token,
      config: channel.config ?? {},
    },
    {
      headers: {
        ...corsHeaders(origin),
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request.headers.get("origin")),
      "Access-Control-Max-Age": "86400",
    },
  });
}
