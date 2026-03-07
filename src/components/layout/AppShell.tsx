import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { SidebarSystem } from "@/lib/dashboard/sidebar-data";

interface AppShellProps {
  children: React.ReactNode;
  systems: SidebarSystem[];
  agentCount?: number;
  clientCount?: number;
}

export function AppShell({ children, systems, agentCount, clientCount }: AppShellProps) {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      <Sidebar systems={systems} agentCount={agentCount} clientCount={clientCount} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative z-10">
        <Header systems={systems} />
        <main className="flex-1 overflow-y-auto bg-card rounded-tl-[32px] border-t border-l border-border/40 p-4 md:p-8 ml-0 md:ml-0 shadow-2xl">
          {children}
        </main>
      </div>
    </div>
  );
}
