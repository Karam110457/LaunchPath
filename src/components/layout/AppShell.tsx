"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { SidebarSystem } from "@/lib/dashboard/sidebar-data";
import { LiquidGlassFilter } from "@/components/ui/LiquidGlassFilter";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  systems: SidebarSystem[];
  agentCount?: number;
  clientCount?: number;
}

export function AppShell({ children, systems, agentCount, clientCount }: AppShellProps) {
  const pathname = usePathname();
  const isBuilder = pathname?.match(/\/dashboard\/agents\/.+/);

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      <LiquidGlassFilter />
      <Sidebar systems={systems} agentCount={agentCount} clientCount={clientCount} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out relative z-10">
        <div className={cn("transition-all duration-500 ease-in-out origin-top", isBuilder ? "h-0 opacity-0 overflow-hidden" : "h-14 opacity-100")}>
          <Header systems={systems} />
        </div>
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-card border-border/40 shadow-2xl transition-all duration-500 ease-in-out relative",
            isBuilder ? "p-0 rounded-none border-0" : "p-4 md:p-8 rounded-tl-[32px] border-t border-l"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
