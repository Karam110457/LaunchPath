/**
 * POST /api/agents/[agentId]/voice-preview
 * Generates a TTS audio preview using OpenAI's TTS API.
 * Returns audio/mpeg stream. Costs 1 credit per preview.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_VOICES = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer",
]);

const MAX_TEXT_LENGTH = 500;
const CREDIT_COST = 1;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify ownership
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id, user_id")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Parse body
  const body = await request.json().catch(() => null);
  if (!body?.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const text = body.text.slice(0, MAX_TEXT_LENGTH);
  const voiceId = ALLOWED_VOICES.has(body.voiceId) ? body.voiceId : "nova";
  const speed = Math.min(2, Math.max(0.5, Number(body.speed) || 1));

  // Pre-flight credit check
  const { data: credits } = await supabase
    .from("user_credits")
    .select("monthly_included, monthly_used, topup_balance")
    .eq("user_id", user.id)
    .single();

  if (credits) {
    const available =
      (credits.monthly_included - credits.monthly_used) + credits.topup_balance;
    if (available < CREDIT_COST) {
      return NextResponse.json(
        { error: "Insufficient credits for voice preview" },
        { status: 402 }
      );
    }
  }

  // Generate TTS
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice preview not configured" },
      { status: 503 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voiceId as "alloy",
      input: text,
      speed,
      response_format: "mp3",
    });

    // Deduct credit
    try {
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        agent_id: agentId,
        model: "tts-1",
        model_tier: "fast",
        credits_consumed: CREDIT_COST,
        input_tokens: text.length,
        output_tokens: 0,
      });

      await supabase.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: CREDIT_COST,
      });
    } catch {
      // Credit logging is non-blocking
    }

    // Stream audio response
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
