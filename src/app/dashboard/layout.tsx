import { requireAuth } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <AppShell>{children}</AppShell>;
}
