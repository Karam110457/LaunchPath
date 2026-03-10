import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PortalConversationsList } from "@/components/portal/PortalConversationsList";

export default async function PreviewConversations({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) notFound();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .order("name");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
      <PortalConversationsList campaigns={campaigns ?? []} />
    </div>
  );
}
