/**
 * POST /api/builder/[systemId]/publish
 * Authenticated endpoint. Persists page code to the database.
 * Keeps demo_config untouched (still drives form fields, scoring prompt).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const code = body.code;

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Code is required" },
      { status: 400 }
    );
  }

  if (!code.includes("function DemoPage")) {
    return NextResponse.json(
      { error: 'Code must define a "function DemoPage()" component' },
      { status: 400 }
    );
  }

  if (!code.includes("InteractiveDemo")) {
    return NextResponse.json(
      { error: "Code must include <InteractiveDemo />" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("user_systems")
    .update({ page_code: code })
    .eq("id", systemId)
    .eq("user_id", user.id);

  if (updateError) {
    logger.error("Failed to publish page code", {
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
