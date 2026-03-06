/**
 * Clients API (authenticated — agency users only)
 * GET  /api/clients  — list all clients with counts
 * POST /api/clients  — create a new client
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*, campaigns(id)")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }

  // Shape: add campaign_count, strip raw join
  const shaped = (clients ?? []).map((c) => {
    const { campaigns, ...rest } = c as Record<string, unknown> & {
      campaigns: { id: string }[] | null;
    };
    return {
      ...rest,
      campaign_count: campaigns?.length ?? 0,
    };
  });

  return NextResponse.json({ clients: shaped });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    website?: string;
    logo_url?: string;
  };

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      email: body.email?.trim() || null,
      website: body.website?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }

  return NextResponse.json({ client }, { status: 201 });
}
