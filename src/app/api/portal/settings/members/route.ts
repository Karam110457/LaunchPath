/**
 * Portal Member Management API
 * POST   /api/portal/settings/members — invite member (admin only)
 * DELETE /api/portal/settings/members — remove member (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireClientAuth } from "@/lib/auth/guards";
import { canPerform } from "@/lib/auth/portal-permissions";
import { logger } from "@/lib/security/logger";

export async function POST(request: NextRequest) {
  const { clientId, role, user } = await requireClientAuth();

  if (!canPerform(role, "settings.invite_member")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    role?: string;
  };

  if (!body.email || typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const memberRole = body.role === "admin" ? "admin" : "viewer";

  const serviceClient = createServiceClient();
  const supabase = await createClient();

  // Check if email already exists
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email
  );

  if (existingUser) {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from("client_members")
      .select("id")
      .eq("client_id", clientId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a member" },
        { status: 409 }
      );
    }

    const { error: memberError } = await serviceClient
      .from("client_members")
      .insert({
        client_id: clientId,
        user_id: existingUser.id,
        role: memberRole,
        invited_by: user.id,
      });

    if (memberError) {
      logger.error("Portal: failed to add member", { error: memberError, clientId });
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User added as member",
      created_account: false,
    });
  }

  // Invite new user via magic link
  const { data: inviteData, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { role: "client" },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_ORIGIN}/portal`,
    });

  if (inviteError || !inviteData?.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Failed to send invite" },
      { status: 500 }
    );
  }

  const { error: memberError } = await serviceClient
    .from("client_members")
    .insert({
      client_id: clientId,
      user_id: inviteData.user.id,
      role: memberRole,
      invited_by: user.id,
    });

  if (memberError) {
    return NextResponse.json(
      { error: "Invite sent but failed to create membership" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: "Invite sent via email", created_account: true },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  const { clientId, role, user } = await requireClientAuth();

  if (!canPerform(role, "settings.remove_member")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await request.json()) as { member_id?: string };

  if (!body.member_id) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify the member belongs to this client
  const { data: member } = await supabase
    .from("client_members")
    .select("id, user_id")
    .eq("id", body.member_id)
    .eq("client_id", clientId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove yourself
  if (member.user_id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("client_members")
    .delete()
    .eq("id", body.member_id);

  if (error) {
    logger.error("Portal: failed to remove member", { error, memberId: body.member_id });
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
