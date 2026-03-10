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
    <div className="w-full max-w-7xl mx-auto px-6 flex flex-col" style={{ height: "calc(100dvh - 80px)" }}>
      <div className="mb-6 pt-2 shrink-0">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground text-lg mt-2">
          View and manage all conversations across your campaigns
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <PortalInbox campaigns={campaigns ?? []} />
      </div>
    </div>
  );
}
