/**
 * POST /api/clients/[clientId]/invite
 *
 * Invite a user to the client portal via magic link.
 * Body: { email, role?: 'admin' | 'viewer' }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
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

  // Verify agency owns this client
  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    email?: string;
    role?: string;
  };

  if (!body.email || typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const role = body.role === "admin" ? "admin" : "viewer";

  // Check if this email is already a member
  const serviceClient = createServiceClient();
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email
  );

  if (existingUser) {
    // Check if already a member of this client
    const { data: existingMember } = await supabase
      .from("client_members")
      .select("id")
      .eq("client_id", clientId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a member of this client" },
        { status: 409 }
      );
    }

    // User exists — just add as member
    const { error: memberError } = await serviceClient
      .from("client_members")
      .insert({
        client_id: clientId,
        user_id: existingUser.id,
        role,
        invited_by: user.id,
      });

    if (memberError) {
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User added as member",
      created_account: false,
    });
  }

  // User doesn't exist — invite via magic link
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

  // Create membership for the newly invited user
  const { error: memberError } = await serviceClient
    .from("client_members")
    .insert({
      client_id: clientId,
      user_id: inviteData.user.id,
      role,
      invited_by: user.id,
    });

  if (memberError) {
    return NextResponse.json(
      { error: "Invite sent but failed to create membership record" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Invite sent via email",
      created_account: true,
    },
    { status: 201 }
  );
}
