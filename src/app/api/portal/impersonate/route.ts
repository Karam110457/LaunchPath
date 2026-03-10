import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/portal/impersonate
 * Sets the portal-impersonate cookie so agency owners can view the portal as a client.
 * Body: { clientId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await request.json();
  if (!clientId || typeof clientId !== "string") {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Verify the user owns this client
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("portal-impersonate", clientId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  return response;
}

/**
 * DELETE /api/portal/impersonate
 * Clears the portal-impersonate cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("portal-impersonate", "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });
  return response;
}
