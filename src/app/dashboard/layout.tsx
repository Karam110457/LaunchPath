import { requireAuth } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";
import { getSidebarData } from "@/lib/dashboard/sidebar-data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const { systems, user: sidebarUser, agentCount } = await getSidebarData(
    user.id,
    user.email,
  );

  return (
    <AppShell systems={systems} user={sidebarUser} agentCount={agentCount}>
      {children}
    </AppShell>
  );
}
