import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientUsageDashboard } from "@/components/clients/ClientUsageDashboard";

export default async function ClientUsagePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/dashboard/clients");

  return (
    <ClientUsageDashboard clientId={client.id} clientName={client.name} />
  );
}
