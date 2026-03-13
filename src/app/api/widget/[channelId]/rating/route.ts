/**
 * Widget CSAT Rating API
 * POST /api/widget/[channelId]/rating
 *
 * Stores a CSAT rating for a conversation after it's closed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const origin = request.headers.get("origin") ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let body: { sessionId?: string; rating?: number; feedback?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!body.sessionId || typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { error: "sessionId and rating (1-5) are required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const supabase = createServiceClient();

  // Find the conversation
  const { data: conversation } = await supabase
    .from("channel_conversations")
    .select("id, metadata")
    .eq("channel_id", channelId)
    .eq("session_id", body.sessionId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  // Store rating in metadata
  const existingMetadata = (conversation.metadata ?? {}) as Record<string, unknown>;
  const updatedMetadata = {
    ...existingMetadata,
    csat_rating: body.rating,
    csat_feedback: body.feedback || null,
    csat_submitted_at: new Date().toISOString(),
  };

  await supabase
    .from("channel_conversations")
    .update({ metadata: updatedMetadata })
    .eq("id", conversation.id);

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
