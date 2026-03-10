import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalProvider } from "@/contexts/PortalContext";
import { PreviewBanner } from "@/components/portal/PreviewBanner";

export default async function PortalPreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify the agency user owns this client
  const { data: client } = await supabase
    .from("clients")
    .select("name, logo_url")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) notFound();

  // Fetch branding
  const { data: branding } = await supabase
    .from("client_branding")
    .select("primary_color, accent_color, logo_url")
    .eq("client_id", clientId)
    .single();

  const clientName = client.name;
  const clientLogo = branding?.logo_url ?? client.logo_url ?? null;

  const brandingStyles: Record<string, string> = {};
  if (branding?.primary_color) brandingStyles["--portal-primary"] = branding.primary_color;
  if (branding?.accent_color) brandingStyles["--portal-accent"] = branding.accent_color;

  return (
    <PortalProvider
      value={{ clientId, role: "admin", clientName, clientLogo, basePath: `/portal/preview/${clientId}` }}
    >
      <div style={brandingStyles as React.CSSProperties}>
        <PreviewBanner clientName={clientName} clientId={clientId} />
        <PortalShell
          clientName={clientName}
          clientLogo={clientLogo}
          role="admin"
          previewMode
        >
          {children}
        </PortalShell>
      </div>
    </PortalProvider>
  );
}
