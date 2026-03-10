import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

export default async function ClientConversationDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; conversationId: string }>;
}) {
  const { clientId, conversationId } = await params;
  await requireAuth();
  redirect(`/dashboard/clients/${clientId}/conversations?id=${conversationId}`);
}
