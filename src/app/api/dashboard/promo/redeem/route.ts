import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "Please enter a promo code" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("redeem_promo", {
    p_user_id: user.id,
    p_code: code,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The RPC returns a JSONB object with either { error } or { success, credits_added }
  const result = data as { error?: string; success?: boolean; credits_added?: number };

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    credits_added: result.credits_added,
  });
}
