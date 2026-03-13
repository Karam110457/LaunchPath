import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: docs } = await supabase
    .from("agent_knowledge_documents")
    .select("id, status")
    .eq("agent_id", agentId)
    .eq("user_id", user.id);

  return NextResponse.json(docs ?? []);
}
