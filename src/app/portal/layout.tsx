import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/PortalShell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clientId } = await requireClientAuth();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("name, logo_url")
    .eq("id", clientId)
    .single();

  return (
    <PortalShell
      clientName={client?.name ?? "Client"}
      clientLogo={client?.logo_url}
    >
      {children}
    </PortalShell>
  );
}
