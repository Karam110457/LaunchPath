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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage all conversations across your campaigns</p>
      </div>
      <PortalConversationsList campaigns={campaigns ?? []} />
    </div>
  );
}
