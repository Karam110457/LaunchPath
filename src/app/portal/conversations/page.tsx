import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PortalInbox } from "@/components/portal/PortalInbox";

export default async function PortalConversations() {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .order("name");

  return (
    <div className="p-4 lg:p-6 h-[100dvh] flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and manage all conversations across your campaigns
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <PortalInbox campaigns={campaigns ?? []} />
      </div>
    </div>
  );
}
