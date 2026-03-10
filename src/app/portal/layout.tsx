import { requireClientAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalProvider } from "@/contexts/PortalContext";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clientId, role } = await requireClientAuth();
  const supabase = await createClient();

  const [clientRes, brandingRes] = await Promise.all([
    supabase
      .from("clients")
      .select("name, logo_url")
      .eq("id", clientId)
      .single(),
    supabase
      .from("client_branding")
      .select("primary_color, accent_color, logo_url, favicon_url")
      .eq("client_id", clientId)
      .single(),
  ]);

  const client = clientRes.data;
  const branding = brandingRes.data;

  const clientName = client?.name ?? "Client";
  const clientLogo = branding?.logo_url ?? client?.logo_url ?? null;

  // Build CSS custom properties for white-label theming
  const brandingStyles: Record<string, string> = {};
  if (branding?.primary_color) brandingStyles["--portal-primary"] = branding.primary_color;
  if (branding?.accent_color) brandingStyles["--portal-accent"] = branding.accent_color;

  return (
    <PortalProvider
      value={{ clientId, role, clientName, clientLogo }}
    >
      <div style={brandingStyles as React.CSSProperties}>
        <PortalShell
          clientName={clientName}
          clientLogo={clientLogo}
          role={role}
        >
          {children}
        </PortalShell>
      </div>
    </PortalProvider>
  );
}
