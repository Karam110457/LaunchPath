/**
 * Single Client API (authenticated — agency users only)
 * GET    /api/clients/[clientId]  — client detail with campaigns + members
 * PATCH  /api/clients/[clientId]  — update client fields
 * DELETE /api/clients/[clientId]  — delete client
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
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

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch campaigns for this client
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, agent_id, ai_agents(name, personality)")
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch members
  const { data: members } = await supabase
    .from("client_members")
    .select("id, user_id, role, created_at")
    .eq("client_id", clientId);

  // Fetch branding
  const { data: branding } = await supabase
    .from("client_branding")
    .select("primary_color, accent_color, logo_url, favicon_url, custom_css, custom_domain")
    .eq("client_id", clientId)
    .single();

  return NextResponse.json({
    client,
    campaigns: campaigns ?? [],
    members: members ?? [],
    branding: branding ?? null,
  });
}

export async function PATCH(
  request: NextRequest,
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
  const { data: existing } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string | null;
    website?: string | null;
    logo_url?: string | null;
    status?: string;
    credit_cap_monthly?: number | null;
    branding?: {
      primary_color?: string | null;
      accent_color?: string | null;
      logo_url?: string | null;
      favicon_url?: string | null;
    };
  };

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 }
      );
    }
    updates.name = body.name.trim();
  }

  if (body.email !== undefined) {
    updates.email = body.email?.trim() || null;
  }

  if (body.website !== undefined) {
    updates.website = body.website?.trim() || null;
  }

  if (body.logo_url !== undefined) {
    updates.logo_url = body.logo_url?.trim() || null;
  }

  if (body.status !== undefined) {
    const validStatuses = new Set(["active", "paused", "archived"]);
    if (!validStatuses.has(body.status)) {
      return NextResponse.json(
        { error: "status must be active, paused, or archived" },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (body.credit_cap_monthly !== undefined) {
    // null = unlimited, number = monthly cap
    updates.credit_cap_monthly = body.credit_cap_monthly;
  }

  // Handle branding upsert
  if (body.branding) {
    const brandingFields: Record<string, unknown> = {};
    if (body.branding.primary_color !== undefined) {
      brandingFields.primary_color = body.branding.primary_color?.trim() || null;
    }
    if (body.branding.accent_color !== undefined) {
      brandingFields.accent_color = body.branding.accent_color?.trim() || null;
    }
    if (body.branding.logo_url !== undefined) {
      brandingFields.logo_url = body.branding.logo_url?.trim() || null;
    }
    if (body.branding.favicon_url !== undefined) {
      brandingFields.favicon_url = body.branding.favicon_url?.trim() || null;
    }

    if (Object.keys(brandingFields).length > 0) {
      const { error: brandErr } = await supabase
        .from("client_branding")
        .upsert(
          { client_id: clientId, ...brandingFields, updated_at: new Date().toISOString() },
          { onConflict: "client_id" }
        );
      if (brandErr) {
        return NextResponse.json(
          { error: "Failed to update branding" },
          { status: 500 }
        );
      }
    }
  }

  if (Object.keys(updates).length === 0 && !body.branding) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  let client = existing;
  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", clientId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update client" },
        { status: 500 }
      );
    }
    client = data;
  }

  return NextResponse.json({ client });
}

export async function DELETE(
  _req: NextRequest,
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

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
