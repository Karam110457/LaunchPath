/**
 * Agency-Wide Analytics API (authenticated — agency owner)
 * GET /api/dashboard/analytics?period=30d
 *
 * Returns per-client usage summary for the agency comparison view.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllClientsUsageSummary } from "@/lib/dashboard/client-usage-data";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const data = await getAllClientsUsageSummary(supabase, user.id, period);

  return NextResponse.json(data);
}
