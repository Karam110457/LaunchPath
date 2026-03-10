"use client";

import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { PortalSidebar } from "./PortalSidebar";

interface PortalShellProps {
  children: React.ReactNode;
  clientName: string;
  clientLogo?: string | null;
  role: "admin" | "viewer";
  previewMode?: boolean;
}

export function PortalShell({ children, clientName, clientLogo, role, previewMode }: PortalShellProps) {
  return (
    <div className={`min-h-screen bg-background flex antialiased relative overflow-hidden ${previewMode ? "pt-10" : ""}`}>
      <GlobalBackground />
      <PortalSidebar clientName={clientName} clientLogo={clientLogo} role={role} />
      <div className="relative z-10 flex-1 flex flex-col md:ml-[280px] min-w-0">
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
