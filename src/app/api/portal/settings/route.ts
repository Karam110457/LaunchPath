/**
 * Portal Settings API
 * GET   /api/portal/settings — client info + members with emails
 * PATCH /api/portal/settings — update client info (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
import { logger } from "@/lib/security/logger";

export async function GET() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, website, logo_url, status")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Get members
  const { data: members } = await supabase
    .from("client_members")
    .select("id, user_id, role, created_at")
    .eq("client_id", clientId);

  // Resolve emails via service client (auth.users not accessible via RLS)
  const serviceClient = createServiceClient();
  const memberUserIds = (members ?? []).map((m) => m.user_id);
  let emailMap: Record<string, string> = {};

  if (memberUserIds.length > 0) {
    const { data: usersData } = await serviceClient.auth.admin.listUsers();
    const users = usersData?.users ?? [];
    for (const u of users) {
      if (memberUserIds.includes(u.id) && u.email) {
        emailMap[u.id] = u.email;
      }
    }
  }

  const shapedMembers = (members ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    email: emailMap[m.user_id] ?? null,
    role: m.role,
    created_at: m.created_at,
  }));

  return NextResponse.json({ client, members: shapedMembers });
}

export async function PATCH(request: NextRequest) {
  const { clientId, role } = await requireClientAuth();

  if (!canPerform(role, "settings.edit")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    website?: string;
  };

  const updates: Record<string, unknown> = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.email !== undefined) updates.email = body.email?.trim() || null;
  if (body.website !== undefined) updates.website = body.website?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Use service client since clients RLS only allows owner writes
  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("clients")
    .update(updates)
    .eq("id", clientId);

  if (error) {
    logger.error("Portal: failed to update client settings", { error, clientId });
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
