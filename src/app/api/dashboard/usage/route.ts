import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/dashboard/usage-data";
import { MODEL_OPTIONS } from "@/lib/ai/model-tiers";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const view = params.get("view");

  // ---------- Request history (paginated) ----------
  if (view === "history") {
    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 50));
    const offset = (page - 1) * limit;
    const modelFilter = params.get("model") || null;
    const providerFilter = params.get("provider") || null;

    // Build query
    let query = supabase
      .from("usage_logs")
      .select(
        "id, model, model_tier, credits_consumed, input_tokens, output_tokens, created_at",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (modelFilter) {
      query = query.eq("model", modelFilter);
    }

    if (providerFilter) {
      // Find all model IDs for this provider
      const providerModels = MODEL_OPTIONS.filter(
        (m) => m.provider.toLowerCase() === providerFilter.toLowerCase()
      ).map((m) => m.value);
      if (providerModels.length > 0) {
        query = query.in("model", providerModels);
      }
    }

    const { data: rows, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      rows: rows ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  }

  // ---------- Default: aggregated usage data ----------
  const period = params.get("period") ?? "30d";
  const data = await getUsageData(supabase, user.id, period);

  return NextResponse.json(data);
}
