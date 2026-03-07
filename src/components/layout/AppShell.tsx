"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import type { SidebarSystem } from "@/lib/dashboard/sidebar-data";

interface AppShellProps {
  children: React.ReactNode;
  systems: SidebarSystem[];
  agentCount?: number;
  clientCount?: number;
}

export function AppShell({ children, systems, agentCount, clientCount }: AppShellProps) {
  const pathname = usePathname();
  const isBuilder = pathname && (pathname.endsWith("/builder") || pathname.match(/\/dashboard\/agents\/[^/]+$/));

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      <div
        className={cn(
          "transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] h-screen shrink-0 overflow-hidden",
          isBuilder ? "w-0 opacity-0" : "w-64 opacity-100"
        )}
      >
        <div className="w-64 h-full">
          <Sidebar systems={systems} agentCount={agentCount} clientCount={clientCount} />
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative z-10 bg-background">
        <div
          className={cn(
            "transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden shrink-0",
            isBuilder ? "h-0 opacity-0" : "h-14 opacity-100"
          )}
        >
          <Header systems={systems} />
        </div>
        <main className={cn(
          "flex-1 overflow-y-auto bg-card border-l border-border/40 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
          isBuilder
            ? "rounded-tl-none border-t-0 p-0 shadow-none z-50 relative"
            : "rounded-tl-[32px] border-t p-4 md:p-8 ml-0 md:ml-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
