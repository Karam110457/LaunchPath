/**
 * Per-Client Usage API (authenticated — agency owner only)
 * GET /api/clients/[clientId]/usage?period=30d
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientUsageData } from "@/lib/dashboard/client-usage-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify ownership
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const data = await getClientUsageData(supabase, user.id, clientId, period);

  return NextResponse.json(data);
}
