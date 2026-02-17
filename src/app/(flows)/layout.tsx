import { requireAuth } from "@/lib/auth/guards";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function FlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <Sidebar />
      <div className="fixed inset-0 md:left-64 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
