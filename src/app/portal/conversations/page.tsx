import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PortalConversationsList } from "@/components/portal/PortalConversationsList";

export default async function PortalConversations() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  // Get campaigns for the filter dropdown
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
