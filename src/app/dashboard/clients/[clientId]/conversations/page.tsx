import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ConversationInbox } from "@/components/conversations/ConversationInbox";

export default async function ClientConversationsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="p-4 lg:p-6 h-[calc(100dvh-64px)] flex flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View conversations across this client&apos;s campaigns
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ConversationInbox campaigns={campaigns ?? []} clientId={clientId} />
      </div>
    </div>
  );
}
