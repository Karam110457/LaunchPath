import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { SidebarSystem, SidebarUser } from "@/lib/dashboard/sidebar-data";

interface AppShellProps {
  children: React.ReactNode;
  systems: SidebarSystem[];
  user: SidebarUser;
  agentCount?: number;
  clientCount?: number;
}

export function AppShell({ children, systems, user, agentCount, clientCount }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex p-4 font-sans">
      <Sidebar systems={systems} user={user} agentCount={agentCount} clientCount={clientCount} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out bg-white rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden ml-0 md:ml-4 relative z-10">
        <Header systems={systems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
