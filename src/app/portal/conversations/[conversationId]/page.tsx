import { redirect } from "next/navigation";
import { requireClientAuth } from "@/lib/auth/guards";

/**
 * Direct conversation links redirect to the inbox with the conversation selected.
 * This preserves backwards compatibility with existing links/bookmarks.
 */
export default async function PortalConversationDetail({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  await requireClientAuth();
  redirect(`/portal/conversations?id=${conversationId}`);
}
