/**
 * POST /api/builder/[systemId]/publish
 * Authenticated endpoint. Persists a DemoConfig to the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoConfigSchema } from "@/lib/ai/schemas";
import { logger } from "@/lib/security/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const { systemId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = demoConfigSchema.safeParse(body.config);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid config", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("user_systems")
    .update({ demo_config: parsed.data })
    .eq("id", systemId)
    .eq("user_id", user.id);

  if (updateError) {
    logger.error("Failed to publish demo config", {
      systemId,
      userId: user.id,
      code: updateError.code,
    });
    return NextResponse.json(
      { error: "Failed to save changes" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
