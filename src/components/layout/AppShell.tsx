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
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden relative">
      <div
        className={cn(
          "transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] h-screen shrink-0 overflow-hidden py-4 pl-4",
          isBuilder ? "w-0 opacity-0 p-0" : "w-[280px] opacity-100"
        )}
      >
        <div className="w-full h-full">
          <Sidebar systems={systems} agentCount={agentCount} clientCount={clientCount} />
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative z-10 bg-transparent">
        <div
          className={cn(
            "transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0 px-4 pt-4 md:px-8 md:pt-6 pb-2",
            isBuilder ? "h-0 opacity-0 p-0 overflow-hidden" : "opacity-100"
          )}
        >
          <Header systems={systems} />
        </div>
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
          isBuilder
            ? "border-0 p-0 z-50 relative bg-background"
            : "px-4 md:px-8 pb-8 relative"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
