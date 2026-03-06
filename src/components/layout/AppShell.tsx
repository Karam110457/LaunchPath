import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { SidebarSystem, SidebarUser } from "@/lib/dashboard/sidebar-data";

interface AppShellProps {
  children: React.ReactNode;
  systems: SidebarSystem[];
  user: SidebarUser;
  agentCount?: number;
  clientCount?: number;
  campaignCount?: number;
}

export function AppShell({ children, systems, user, agentCount, clientCount, campaignCount }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar systems={systems} user={user} agentCount={agentCount} clientCount={clientCount} campaignCount={campaignCount} />
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 transition-all duration-300 ease-in-out">
        <Header systems={systems} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
