import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientWorkspaceShell } from "@/components/clients/ClientWorkspaceShell";

export default async function ClientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, logo_url, status")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/dashboard/clients");

  return (
    <ClientWorkspaceShell
      clientId={client.id}
      clientName={client.name}
      clientLogo={client.logo_url}
      clientStatus={client.status}
    >
      {children}
    </ClientWorkspaceShell>
  );
}
